import { _MAP_MEMBER_, _SET_MEMBER_ } from "./static";

/**
 * @description A path segment that addresses a member of a `Map`: `key` is
 * the member key inside the container found at the preceding position.
 */
export interface MapMemberMarker<K = PropertyKey> {
  [_MAP_MEMBER_]: true;
  key: K;
}

/**
 * @description A path segment that addresses a member of a `Set`. Sets have no
 * keys, so the member is located by its object identity; `id` is a per-store
 * identifier allocated when the marker is created, which keeps the
 * proxy-cache key encodable as a string and collectable with the member.
 */
export interface SetMemberMarker<V = unknown> {
  [_SET_MEMBER_]: true;
  ref: V;
  id: string;
}

/** One step of a {@link StatePath}: a property key or a member marker. */
export type StatePathSegment = PropertyKey | MapMemberMarker | SetMemberMarker;

/**
 * @description The ordered path from the root state to a value, expressed as
 * property keys and container-member markers. `path[0]` is the first-level
 * key of the root state and `path[path.length - 1]` is the key (or member
 * marker) being read or written.
 *
 * 🌟 An ordered array is used instead of a `Set` of `{ key }` wrappers because
 * a `Set` de-duplicates equal keys, which collapses paths such as
 * `{ x: { x: { x: 1 } } }`, and because the consumers must drop the first
 * level (`shift()`/`slice(1)`) — an operation that must not depend on the
 * iteration order of a collection.
 */
export type StatePath = StatePathSegment[];
