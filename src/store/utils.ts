import type { StatePath, StatePathSegment } from "../immutable/types";
import { isMapMember, isSetMember } from "../immutable/utils";
import { _PATH_KEY_SEPARATOR_ } from "./static";

/** Resolve a symbol property segment to a store-local unique id. */
export type SymbolSegmentId = (key: symbol) => string;

/**
 * @description Encode one path segment.
 *
 * The value is prefixed with the type of the segment (`s` for a string, `n`
 * for a number, `y` for a symbol, `M` for a Map-member marker, `S` for a
 * Set-member marker) so that `1` and `'1'` cannot encode identically, and
 * every separator inside the text is doubled. Because only a *single*
 * separator can then ever separate two segments, the encoding cannot be
 * ambiguous.
 *
 * A Map-member marker encodes its inner key recursively, so a key containing
 * the separator stays collision-free. A Set-member marker encodes the
 * per-store id of its member — the member itself is an object reference,
 * which no string can hold — which makes two different members of the same
 * set resolve to different cache entries.
 *
 * A symbol property segment has no textual form that is unique by value. Store
 * paths pass a {@link SymbolSegmentId} so two distinct symbols sharing a
 * description get different keys; direct callers that omit it fall back to the
 * description, which keeps the utility usable outside a store.
 */
export const encodeSegment = (key: StatePathSegment, symbolId?: SymbolSegmentId): string => {
  if (isMapMember(key)) {
    /**
     * @description Object / function keys carry a per-store id: `String(key)`
     * collapses every object to `[object Object]`, so the same target under two
     * object keys would otherwise share one cache entry (and one path).
     */
    return key.id === undefined
      ? `M${encodeSegment(key.key as StatePathSegment, symbolId)}`
      : `M@${key.id}`;
  }
  if (isSetMember(key)) return `S${key.id}`;
  const prefixed = typeof key === "string"
    ? `s${key}`
    : typeof key === "number"
      ? `n${key}`
      : symbolId
        ? `y@${symbolId(key)}`
        : `y${key.description ?? String(key)}`;
  return prefixed.split(_PATH_KEY_SEPARATOR_).join(_PATH_KEY_SEPARATOR_ + _PATH_KEY_SEPARATOR_);
};

/** @description Append one encoded segment to a parent path key. */
export const appendSegmentKey = (
  parentKey: string,
  key: StatePathSegment,
  symbolId?: SymbolSegmentId,
): string => {
  const segmentKey = encodeSegment(key, symbolId);
  return parentKey === "" ? segmentKey : `${parentKey}${_PATH_KEY_SEPARATOR_}${segmentKey}`;
};

/**
 * @description Encode every prefix of a path in one pass.
 *
 * The last entry equals {@link pathKey}; the earlier entries are the cache keys
 * of the ancestors. A commit can therefore encode the written path once and
 * slice the keys for all replaced levels instead of re-encoding each prefix.
 */
export const pathKeys = (path: StatePath, symbolId?: SymbolSegmentId): string[] => {
  const keys: string[] = [""];
  let key = "";
  for (const segment of path) {
    key = appendSegmentKey(key, segment, symbolId);
    keys.push(key);
  }
  return keys;
};

/**
 * @description Encode a state path into the key used by the wrapper cache.
 *
 * The cache is keyed by path rather than by target alone: the same object
 * can be reachable through several paths, and a wrapper can only carry one
 * path as its writable location. `pathKey` is what makes that key collision-free.
 *
 * A plain `Array.prototype.join` cannot do this. Joining with a separator loses
 * the distinction between a separator *between* segments and one *inside* a
 * property name:
 *
 * ```ts
 * ['a', 'sb'].join(SEP)   === 'a' + SEP + 'sb'   // two segments
 * ['a\u0001sb'].join(SEP) === 'a' + SEP + 'sb'   // one segment, same string
 * ```
 *
 * Both paths produce the identical key, so two different state locations would
 * share one cache entry and one of them would resolve to the wrong object.
 * Escaping each segment fixes this: the second path becomes
 * `'a' + SEP + SEP + 'sb'`, which no longer matches.
 *
 * Each segment is also type-prefixed, so `[1]` and `['1']` stay distinct.
 * Symbol *property* segments use the store-local {@link SymbolSegmentId} when
 * one is supplied; without it they fall back to the description for direct
 * utility calls. Symbol *Map keys* always carry an id.
 */
export const pathKey = (path: StatePath, symbolId?: SymbolSegmentId): string => {
  const keys = pathKeys(path, symbolId);
  return keys[keys.length - 1];
};

/** Readable rendering of a path for diagnostics. */
export const formatPath = (path: StatePath): string =>
  path.map(segment =>
    isMapMember(segment) ? `:${String(segment.key)}`
      : isSetMember(segment) ? ":<member>"
        : String(segment),
  ).join(".");
