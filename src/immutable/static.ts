/**
 * Marker brands for the state-path segments that address a `Map`/`Set`
 * member. A plain property key cannot locate a member inside a container, so
 * paths carry these boxed markers instead — see `MapMemberMarker` and
 * `SetMemberMarker` in ./types.
 */
export const _MAP_MEMBER_ = Symbol.for("_resy_map_member_");
export const _SET_MEMBER_ = Symbol.for("_resy_set_member_");
