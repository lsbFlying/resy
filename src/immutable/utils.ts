import { whatsType, typeString, slice } from "../utils";
import type { PrimitiveState } from "../types";
import type {
  ApplyOriginFunctionType, IteratorsType, CreateProxyType,
  StatePath, ArrayMapSetIteratorType, IteratorsParentType,
} from "./types";
import { _ITERATOR_META_PROCESSING_KEY_ } from "./static";

// A collection of functions that can be executed by proxies for Maps、 Set prototype chains.
const mapSetPrototypeProxyableSet = new Set<ApplyOriginFunctionType>()
  // map
  .add(Map.prototype.get)
  .add(Map.prototype.has)
  .add(Map.prototype.keys)
  .add(Map.prototype.clear)
  .add(Map.prototype.delete)
  .add(Map.prototype.set)
  .add(Map.prototype.forEach)
  .add(Map.prototype.values)
  .add(Map.prototype.entries)
  // map
  .add(Set.prototype.add)
  .add(Set.prototype.has)
  .add(Set.prototype.clear)
  .add(Set.prototype.delete)
  .add(Set.prototype.forEach)
  .add(Set.prototype.keys)
  .add(Set.prototype.values)
  .add(Set.prototype.entries);

const proxyableSet = new Set(["[object Object]", "[object Array]", "[object Map]", "[object Set]"]);

export const proxyable = (value: unknown) => {
  return proxyableSet.has(typeString.call(value))
    || mapSetPrototypeProxyableSet.has(value as ApplyOriginFunctionType);
};

/**
 * @description Whether a value is a `Map`/`Set` prototype method.
 *
 * Such a method has to be wrapped in a proxy so that calling it enters the
 * `apply` trap, which is what routes it into the matching factory. Calling the
 * built-in directly on the proxy throws `incompatible receiver`, because a
 * proxy does not carry the internal `[[MapData]]`/`[[SetData]]` slot.
 */
export const mapSetPrototypeProxyable = (value: unknown): boolean =>
  mapSetPrototypeProxyableSet.has(value as ApplyOriginFunctionType);

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
 * objects use spread; anything else is returned unchanged so it stays a leaf.
 */
export const cloneShallow = <T>(value: T): T => {
  if (Array.isArray(value)) return slice.call(value as unknown[]) as T;
  if (
    typeof value === "object"
    && value !== null
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)
  ) {
    return { ...(value as object) } as T;
  }
  return value;
};

/**
 * @description Read the value at `path` from `root`. Returns `undefined` as
 * soon as a segment is not penetrable, which makes any write through a leaf
 * a no-op instead of an error.
 */
export const readAtPath = (root: unknown, path: StatePath): unknown => {
  let current: unknown = root;
  for (let i = 0; i < path.length; i++) {
    if (!isPenetrable(current)) return undefined;
    current = (current as Record<PropertyKey, unknown>)[path[i]];
  }
  return current;
};

/**
 * @description Outcome of {@link commitPath}.
 *
 * The union is what lets the caller tell "nothing changed" apart from "this
 * write was refused", and it carries the offending host for the refusal so the
 * diagnostic can name it without walking the path a second time.
 */
export type CommitResult<S> =
  | { committed: true; root: S }
  | { committed: false; reason: "leaf"; host: unknown }
  | { committed: false; reason: "noop" };

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

  // The host is read once, here, and reused for both the guard and the copy.
  const leafOwner = readAtPath(root, rest);
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

  if (!isDelete && Object.is(leafOwner[leafKey], value)) {
    return { committed: false, reason: "noop" };
  }

  const newLeafOwner = cloneShallow(leafOwner);
  if (isDelete) Reflect.deleteProperty(newLeafOwner, leafKey);
  else newLeafOwner[leafKey] = value;

  let current: unknown = newLeafOwner;
  for (let i = rest.length - 1; i >= 0; i--) {
    const next = cloneShallow(readAtPath(root, rest.slice(0, i))) as Record<PropertyKey, unknown>;
    next[rest[i]] = current;
    current = next;
  }

  return { committed: true, root: current as S };
};

/**
 * @description Custom iteration processing for iterable data types.
 * It also handles scenarios involving `for...of` loops.
 * The `for...of` loop reads the `Symbol.iterator` property,
 * which invokes iterator methods such as `values` or `entries`.
 * These methods are equipped with proxy handling.
 */
export const iteratorProcessing = <S extends PrimitiveState>(
  iterator: IteratorsType<S>,
  parentTarget: IteratorsParentType<S>,
  createProxy: CreateProxyType<S>,
  path: StatePath,
  applyOriginFunction?: ApplyOriginFunctionType,
  entriesFlag?: boolean,
) => {
  if (parentTarget[_ITERATOR_META_PROCESSING_KEY_]) return;
  const type = whatsType(iterator);

  const AM_IteratorFlag = type === "Array Iterator" || type === "Map Iterator";

  if (AM_IteratorFlag) {
    const keys = type === "Map Iterator" ? parentTarget.keys().toArray() : null;
    const iteratorArray = AM_IteratorFlag
      ? (iterator as any as ArrayMapSetIteratorType<S>).toArray()
      : iterator;

    // Does not affect the primitive iterators on the prototype chain (prototype [Symbol. iterator])
    iterator[Symbol.iterator] = () => {
      // Index and conditional processing for toReversed method
      let index = -1;

      return {
        next() {
          index++;

          if (index < iteratorArray.length) {
            const key = entriesFlag
              ? iteratorArray[index][0]
              /**
               * @description In scenarios where the `map.values` method returns a `MapIterator`
               * and cannot retrieve the associated keys,
               * the `map.keys` method is used to obtain the corresponding keys for indexing.
               */
              : type === "Map Iterator"
                ? keys[index]
                : index;
            const value = entriesFlag ? iteratorArray[index][1] : iteratorArray[index];

            return {
              done: false,
              value: entriesFlag
                ? [
                  key,
                  proxyable(value)
                    ? createProxy(
                      value,
                      [...path, key],
                      applyOriginFunction,
                    )
                    : value,
                ]
                : proxyable(value)
                  ? createProxy(
                    value,
                    [...path, key],
                    applyOriginFunction,
                  )
                  : value,
            };
          }
          return { done: true };
        }
      };
    };
    AM_IteratorFlag && (iterator.next = iterator[Symbol.iterator]().next);
    parentTarget[_ITERATOR_META_PROCESSING_KEY_] = true;
  }
};
