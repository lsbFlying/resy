import type { StatePath } from "../immutable/types";
import { _PATH_KEY_SEPARATOR_ } from "./static";

/**
 * @description Encode one path segment.
 *
 * The value is prefixed with the type of the segment (`s` for a string, `n` for
 * a number, `y` for a symbol) so that `1` and `'1'` cannot encode identically,
 * and every separator inside the text is doubled. Because only a *single*
 * separator can then ever separate two segments, the encoding cannot be
 * ambiguous.
 */
const encodeSegment = (key: PropertyKey): string => {
  const prefixed = typeof key === "string"
    ? `s${key}`
    : typeof key === "number"
      ? `n${key}`
      : `y${key.description ?? String(key)}`;
  return prefixed.split(_PATH_KEY_SEPARATOR_).join(_PATH_KEY_SEPARATOR_ + _PATH_KEY_SEPARATOR_);
};

/**
 * @description Encode a state path into the key used by the proxy cache.
 *
 * The proxy cache is keyed by path rather than by target alone: the same object
 * can be reachable through several paths, and a proxy can only carry one path
 * as its writable location. `pathKey` is what makes that key collision-free.
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
 * Symbol segments fall back to their description, which is a deliberate
 * approximation recorded in `design.md` (Open Questions): two distinct symbols
 * sharing a description would share a cache entry.
 */
export const pathKey = (path: StatePath): string =>
  path.map(encodeSegment).join(_PATH_KEY_SEPARATOR_);
