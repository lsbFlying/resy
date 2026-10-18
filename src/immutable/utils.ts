import { hasOwnProperty, typeString, slice } from "../utils";
import type { PrimitiveState } from "../types";
import type { MapMemberMarker, SetMemberMarker, StatePath, StatePathSegment } from "./types";
import { _MAP_MEMBER_, _SET_MEMBER_ } from "./static";

const proxyableSet = new Set(["[object Object]", "[object Array]"]);

/**
 * @description Whether a value is wrapped in a store proxy when read from an
 * immutable state: plain objects and arrays only. `Map`/`Set` values are
 * routed to their subclass handles by the store's read router instead, and
 * everything else is a leaf.
 *
 * 🌟 Non-extensible values are leaves too. A proxy must return the exact value
 * for a non-configurable, non-writable own data property, and must not report a
 * successful write that adds a property to a non-extensible target. Wrapping a
 * frozen/sealed object or array therefore breaks reads or writes with a
 * proxy-invariant `TypeError`. Such a branch is already constrained; handing it
 * back raw keeps native frozen/sealed semantics instead of crashing.
 */
export const proxyable = (value: unknown) => {
  if (typeof value === "object" && value !== null && !Object.isExtensible(value)) return false;
  return proxyableSet.has(typeString.call(value));
};

/**
 * @description Whether a path segment addresses a `Map` member.
 */
export const isMapMember = (seg: unknown): seg is MapMemberMarker =>
  typeof seg === "object"
  && seg !== null
  && (seg as MapMemberMarker)[_MAP_MEMBER_] === true;

/**
 * @description Whether a path segment addresses a `Set` member.
 */
export const isSetMember = (seg: unknown): seg is SetMemberMarker =>
  typeof seg === "object"
  && seg !== null
  && (seg as SetMemberMarker)[_SET_MEMBER_] === true;

/**
 * @description Whether a value can be written through by a chained update.
 * Only plain objects and arrays are penetrable; everything else (`Date`,
 * `Map`, `Set`, class instances, …) is treated as an atomic leaf, because
 * cloning such an object would have to preserve prototypes, accessors and
 * private fields, which cannot be done reliably.
 */
export const isPenetrable = (
  value: unknown,
): value is Record<PropertyKey, unknown> =>
  Array.isArray(value)
  || (
    typeof value === "object"
    && value !== null
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)
  );

/**
 * @description Shallow copy of a penetrable value. Arrays use `slice`, plain
 * objects are copied onto a new object with the *same prototype* (so a
 * null-prototype object stays null-prototype); anything else is returned
 * unchanged so it stays a leaf.
 */
export const cloneShallow = <T>(value: T): T => {
  if (Array.isArray(value)) return slice.call(value as unknown[]) as T;
  if (
    typeof value === "object"
    && value !== null
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)
  ) {
    // A null-prototype object must stay null-prototype, while a normal object
    // is copied with spread: `Object.assign` would run the `__proto__` setter
    // for an own `__proto__` data property and silently change the prototype.
    const proto = Object.getPrototypeOf(value);
    return (proto === null
      ? Object.assign(Object.create(null), value)
      : { ...(value as object) }) as T;
  }
  return value;
};

/**
 * @description Read the value at `path` from `root`.
 *
 * Property segments walk plain objects and arrays only; member markers step
 * into `Map`/`Set` containers, which a property key cannot address. Any
 * segment that does not match its container returns `undefined`, which turns
 * a write along a dead (or stale) path into a no-op.
 */
export const readAtPath = (root: unknown, path: StatePath): unknown => {
  let current: unknown = root;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    if (isMapMember(seg)) {
      if (!(current instanceof Map)) return undefined;
      current = current.get(seg.key);
    } else if (isSetMember(seg)) {
      if (!(current instanceof Set) || !current.has(seg.ref)) return undefined;
      current = seg.ref;
    } else {
      if (!isPenetrable(current)) return undefined;
      current = (current as Record<PropertyKey, unknown>)[seg];
    }
  }
  return current;
};

/**
 * @description Outcome of {@link commitPath}.
 *
 * The union is what lets the caller tell "nothing changed" apart from "this
 * write was refused", and it carries the offending host for the refusal so the
 * diagnostic can name it without walking the path a second time.
 *
 * `replaced` lists `[path, previous, next]` for every level this commit cloned.
 * The updater turns those pairs into read-side lineage, so handles follow the
 * objects their own writes produced (and only those).
 */
export type ReplacedLevels = Array<[StatePath, object, object]>;

export type CommitResult<S> =
  | { committed: true; root: S; replaced: ReplacedLevels }
  | { committed: false; reason: "leaf"; host: unknown }
  | { committed: false; reason: "noop" };

/**
 * @description Replace `seg` inside `parent` with `child`, cloning the parent
 * level by its own semantics: a `Map` level copies the entries and upserts the
 * member, a `Set` level copies and swaps the member reference, a plain level
 * uses the ordinary shallow clone. Callers only reach here with levels the
 * walk already validated, so the casts are guaranteed by construction.
 */
/**
 * @description Define an own enumerable data property. Plain assignment would
 * run an inherited setter — most notably `__proto__` — and could change the
 * prototype of the cloned host instead of writing the state key.
 */
const defineData = (target: object, key: PropertyKey, value: unknown) => {
  Object.defineProperty(target, key, {
    value, writable: true, enumerable: true, configurable: true,
  });
};

const setAt = (parent: unknown, seg: StatePathSegment, child: unknown): unknown => {
  if (isMapMember(seg)) {
    const next = new Map(parent as Map<unknown, unknown>);
    next.set(seg.key, child);
    return next;
  }
  if (isSetMember(seg)) {
    const next = new Set(parent as Set<unknown>);
    next.delete(seg.ref);
    next.add(child);
    return next;
  }
  const next = cloneShallow(parent);
  if (Array.isArray(next) && seg === "length") (next as unknown as unknown[]).length = child as number;
  else defineData(next as object, seg as PropertyKey, child);
  return next;
};

/**
 * @description Copy-on-write commit of a single value onto a state path.
 *
 * Every level from the leaf container up to the root is copied once, so the tree
 * that existed before the call is never written to; branches outside the path
 * keep sharing their existing references.
 *
 * 🌟 The returned `root` is a **new object** whenever a change was applied, and
 * the input `root` itself when there was nothing to do. Callers can therefore
 * detect a real change with a single reference comparison.
 *
 * Leaf writes come in three shapes. A property key writes through the plain
 * host as before. A `Map` member marker upserts the member with native `Map`
 * semantics (this is how a nested container handle publishes its clone). A
 * `Set` member marker replaces the member object — the old reference must
 * still be in the set, and re-insertion moves the member to the end, which is
 * acceptable for an unordered collection.
 *
 * @param root - The current state root.
 * @param path - Ordered path; `path[path.length - 1]` is the written key.
 * @param value - The value to write (ignored when `isDelete`).
 * @param isDelete - Remove the final key instead of writing it.
 */
export const commitPath = <S extends PrimitiveState>(
  root: S,
  path: StatePath,
  value: unknown,
  isDelete = false,
): CommitResult<S> => {
  const leafKey = path[path.length - 1];
  const rest = path.slice(0, -1);

  /**
   * @description Every level cloned by this commit, as
   * `[path, previousValue, nextValue]`.
   *
   * The updater turns these pairs into read-side lineage: a handle held before
   * the commit resolves through them to the live location, so a destructured
   * handle keeps writing across its own commits. A whole-value replacement
   * clones no old value and therefore leaves no pair — that is exactly what
   * detaches a handle created for the replaced object.
   */
  const replaced: ReplacedLevels = [];
  const remember = (at: StatePath, before: unknown, after: unknown) => {
    if (
      typeof before === "object" && before !== null
      && typeof after === "object" && after !== null
      && before !== after
    ) {
      replaced.push([at, before, after]);
    }
  };

  // The host is read once, here, and reused for both the guard and the copy.
  const leafOwner = readAtPath(root, rest);

  let newLeafOwner: unknown;

  if (isMapMember(leafKey)) {
    /**
     * @description The write targets a `Map` member: the host is the
     * containing `Map`. A host that is not a `Map` means the handle was
     * stale or the member was removed — an ordinary no-op.
     */
    if (!(leafOwner instanceof Map)) {
      return { committed: false, reason: "noop" };
    }
    if (Object.is(leafOwner.get(leafKey.key), value)) {
      return { committed: false, reason: "noop" };
    }
    newLeafOwner = new Map(leafOwner);
    (newLeafOwner as Map<unknown, unknown>).set(leafKey.key, value);
  } else if (isSetMember(leafKey)) {
    /**
     * @description `Set` members are addressed by reference: the write
     * replaces the member object, so the old reference must still belong to
     * the set and the new value must differ from it.
     */
    if (!(leafOwner instanceof Set) || !leafOwner.has(leafKey.ref)) {
      return { committed: false, reason: "noop" };
    }
    if (Object.is(leafKey.ref, value)) {
      return { committed: false, reason: "noop" };
    }
    newLeafOwner = new Set(leafOwner);
    (newLeafOwner as Set<unknown>).delete(leafKey.ref);
    (newLeafOwner as Set<unknown>).add(value);
  } else {
    if (!isPenetrable(leafOwner)) {
      /**
       * @description Two different situations share this branch.
       *
       * `undefined` means the path does not resolve (a missing intermediate key),
       * which is an ordinary no-op. Anything else means the write ran into a value
       * that cannot be written through, which the caller reports in development.
       */
      return leafOwner === undefined
        ? { committed: false, reason: "noop" }
        : { committed: false, reason: "leaf", host: leafOwner };
    }

    /**
     * @description Deleting a key that does not exist changes nothing. Without
     * this guard it would still clone the host and the root, producing a new
     * state tree and a notification for a no-op.
     */
    if (isDelete && !hasOwnProperty.call(leafOwner, leafKey as PropertyKey)) {
      return { committed: false, reason: "noop" };
    }

    if (
      !isDelete
      && Object.is((leafOwner as Record<PropertyKey, unknown>)[leafKey as PropertyKey], value)
    ) {
      return { committed: false, reason: "noop" };
    }

    newLeafOwner = cloneShallow(leafOwner);
    if (isDelete) Reflect.deleteProperty(newLeafOwner as object, leafKey as PropertyKey);
    else if (Array.isArray(newLeafOwner) && leafKey === "length") {
      (newLeafOwner as unknown as unknown[]).length = value as number;
    } else {
      defineData(newLeafOwner as object, leafKey as PropertyKey, value);
    }
  }

  /**
   * @description The leaf container itself was cloned (plain object/array,
   * `Map` or `Set`); record it before rebuilding its ancestors.
   */
  remember(rest, leafOwner, newLeafOwner);

  /**
   * @description Rebuild from the leaf container up to the root, one clone per
   * level. `readAtPath(root, …)` always reads the *old* tree, so every level
   * is copied from the state that existed before this commit.
   */
  let current: unknown = newLeafOwner;
  for (let i = rest.length - 1; i >= 0; i--) {
    const hostPath = rest.slice(0, i);
    const oldHost = readAtPath(root, hostPath);
    const nextHost = setAt(oldHost, rest[i], current);
    remember(hostPath, oldHost, nextHost);
    current = nextHost;
  }

  return { committed: true, root: current as S, replaced };
};
