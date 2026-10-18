import { _WRAPPER_ORIGIN_ } from "../store/static";
import { isPenetrable } from "./utils";

/**
 * @description Define an own enumerable data property. Plain assignment would
 * run inherited setters — most notably `__proto__`, which could silently change
 * the prototype of a rebuilt state object.
 */
const defineOwn = (
  target: Record<PropertyKey, unknown>,
  key: PropertyKey,
  value: unknown,
) => {
  Object.defineProperty(target, key, {
    value, writable: true, enumerable: true, configurable: true,
  });
};

/**
 * @description Whether any *nested* read-side wrapper has ever been created.
 * The root proxy every store creates does not count: until the first nested
 * immutable read happens, no value can contain a nested wrapper, so the deep
 * scan can be skipped. Non-immutable stores therefore never pay for it.
 */
let hasNestedWrappers = false;

/** Called by the store whenever it registers a nested proxy or container handle. */
export const markNestedWrapperCreated = () => {
  hasNestedWrappers = true;
};

type NormalizeResult = { value: unknown; changed: boolean };

/**
 * @description Deep wrapper removal. Returns the original object when no
 * wrapper was found anywhere below it, so a clean assignment stays
 * allocation-free and shared subtrees keep their identity.
 *
 * `seen` doubles as the cycle guard; provisional entries point at the original
 * object so a self-reference cannot recurse forever.
 */
const stripWrappers = (value: object, seen: WeakMap<object, object>): NormalizeResult => {
  const raw = _WRAPPER_ORIGIN_.get(value);
  if (raw !== undefined) return { value: raw, changed: true };

  const visited = seen.get(value);
  if (visited !== undefined) return { value: visited, changed: false };

  if (Array.isArray(value)) {
    seen.set(value, value);
    const results: Array<NormalizeResult | undefined> = new Array(value.length);
    let changed = false;
    for (let i = 0; i < value.length; i++) {
      if (!(i in value)) continue;
      const item = value[i];
      const result = typeof item === "object" && item !== null
        ? stripWrappers(item, seen)
        : { value: item, changed: false };
      results[i] = result;
      changed = changed || result.changed;
    }
    if (!changed) return { value, changed: false };

    const next: unknown[] = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      const result = results[i];
      if (result !== undefined) next[i] = result.changed ? result.value : value[i];
    }
    seen.set(value, next);
    return { value: next, changed: true };
  }

  if (value instanceof Map) {
    seen.set(value, value);
    const results = new Map<unknown, {
      member: NormalizeResult;
      key: NormalizeResult;
    }>();
    let changed = false;
    value.forEach((member, key) => {
      const memberResult = typeof member === "object" && member !== null
        ? stripWrappers(member, seen)
        : { value: member, changed: false };
      const keyResult = typeof key === "object" && key !== null
        ? stripWrappers(key, seen)
        : { value: key, changed: false };
      results.set(key, { member: memberResult, key: keyResult });
      changed = changed || memberResult.changed || keyResult.changed;
    });
    if (!changed) return { value, changed: false };

    const next = new Map<unknown, unknown>();
    value.forEach((member, key) => {
      const result = results.get(key)!;
      next.set(
        result.key.changed ? result.key.value : key,
        result.member.changed ? result.member.value : member,
      );
    });
    seen.set(value, next);
    return { value: next, changed: true };
  }

  if (value instanceof Set) {
    seen.set(value, value);
    const results = new Map<unknown, NormalizeResult>();
    let changed = false;
    value.forEach(member => {
      const result = typeof member === "object" && member !== null
        ? stripWrappers(member, seen)
        : { value: member, changed: false };
      results.set(member, result);
      changed = changed || result.changed;
    });
    if (!changed) return { value, changed: false };

    const next = new Set<unknown>();
    value.forEach(member => {
      const result = results.get(member)!;
      next.add(result.changed ? result.value : member);
    });
    seen.set(value, next);
    return { value: next, changed: true };
  }

  if (isPenetrable(value)) {
    seen.set(value, value);
    const record = value as Record<PropertyKey, unknown>;
    const keys: PropertyKey[] = [
      ...Object.keys(value as object),
      ...Object.getOwnPropertySymbols(value as object),
    ];
    const results = new Map<PropertyKey, NormalizeResult>();
    let changed = false;
    for (const key of keys) {
      const member = record[key];
      const result = typeof member === "object" && member !== null
        ? stripWrappers(member, seen)
        : { value: member, changed: false };
      results.set(key, result);
      changed = changed || result.changed;
    }
    if (!changed) return { value, changed: false };

    const next = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
    for (const key of keys) {
      const result = results.get(key)!;
      defineOwn(next, key, result.changed ? result.value : record[key]);
    }
    seen.set(value, next);
    return { value: next, changed: true };
  }

  return { value, changed: false };
};

/** Whether any wrapper is still reachable from `value` (cycle-safe). */
const containsWrapper = (value: unknown, seen: WeakSet<object>): boolean => {
  if (typeof value !== "object" || value === null) return false;
  if (_WRAPPER_ORIGIN_.has(value)) return true;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (i in value && containsWrapper(value[i], seen)) return true;
    }
    return false;
  }

  if (value instanceof Map) {
    let found = false;
    value.forEach((member, key) => {
      found = found || containsWrapper(key, seen) || containsWrapper(member, seen);
    });
    return found;
  }

  if (value instanceof Set) {
    let found = false;
    value.forEach(member => { found = found || containsWrapper(member, seen); });
    return found;
  }

  if (isPenetrable(value)) {
    const record = value as Record<PropertyKey, unknown>;
    const keys: PropertyKey[] = [
      ...Object.keys(value as object),
      ...Object.getOwnPropertySymbols(value as object),
    ];
    return keys.some(key => containsWrapper(record[key], seen));
  }

  return false;
};

/**
 * @description Rebuild a value with every wrapper replaced, wiring cycles to
 * the rebuilt shells. Used only as the cyclic fallback of the deep
 * normalization; it rebuilds every container it meets.
 */
const rebuildWithoutWrappers = (value: unknown, memo: WeakMap<object, object>): unknown => {
  if (typeof value !== "object" || value === null) return value;

  const raw = _WRAPPER_ORIGIN_.get(value);
  if (raw !== undefined) return raw;

  const cached = memo.get(value);
  if (cached !== undefined) return cached;

  if (Array.isArray(value)) {
    const next: unknown[] = new Array(value.length);
    memo.set(value, next);
    for (let i = 0; i < value.length; i++) {
      if (i in value) next[i] = rebuildWithoutWrappers(value[i], memo);
    }
    return next;
  }

  if (value instanceof Map) {
    const next = new Map<unknown, unknown>();
    memo.set(value, next);
    value.forEach((member, key) => {
      next.set(
        rebuildWithoutWrappers(key, memo),
        rebuildWithoutWrappers(member, memo),
      );
    });
    return next;
  }

  if (value instanceof Set) {
    const next = new Set<unknown>();
    memo.set(value, next);
    value.forEach(member => next.add(rebuildWithoutWrappers(member, memo)));
    return next;
  }

  if (isPenetrable(value)) {
    const record = value as Record<PropertyKey, unknown>;
    const next = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
    memo.set(value, next);
    for (const key of Object.keys(value as object)) {
      defineOwn(next, key as PropertyKey, rebuildWithoutWrappers(record[key], memo));
    }
    for (const key of Object.getOwnPropertySymbols(value as object)) {
      defineOwn(next, key, rebuildWithoutWrappers(record[key], memo));
    }
    return next;
  }

  return value;
};

/**
 * @description Normalize a value that is about to be written into the state.
 *
 * Wrappers are read-side objects: committing one would store a proxy (or a
 * `ResyMap`/`ResySet` handle) inside `_$state_`, where it would poison
 * serialization, identity comparison and `prevState`.
 *
 * Public writes are normalized deeply because user code can nest a wrapper at
 * any level (`store.target = { deep: { item: store.list[0] } }`).
 * Container-internal commits pass `deep = false`: their values are already raw
 * by construction, so no scan is needed. Unchanged subtrees keep their identity.
 */
export const normalizeWriteValue = (value: unknown, deep = true): unknown => {
  // A direct wrapper (including the root proxy) is always unwrapped; the deep
  // scan only matters once nested wrappers exist somewhere.
  const raw = typeof value === "object" && value !== null
    ? _WRAPPER_ORIGIN_.get(value)
    : undefined;
  if (raw !== undefined) return raw;

  if (!deep || !hasNestedWrappers || typeof value !== "object" || value === null) return value;

  const stripped = stripWrappers(value, new WeakMap());
  if (!stripped.changed) return value;

  /**
   * @description A cyclic value can keep a wrapper reachable through its
   * back-reference (the identity-preserving pass cannot wire a rebuilt object
   * into its own cycle). In that rare case rebuild the whole value: identity of
   * clean subtrees is sacrificed there, but the "no wrapper in state" invariant
   * wins.
   */
  if (!containsWrapper(stripped.value, new WeakSet())) return stripped.value;
  return rebuildWithoutWrappers(value, new WeakMap());
};
