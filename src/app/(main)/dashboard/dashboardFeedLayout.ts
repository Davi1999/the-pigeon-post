/**
 * Fixed frame for multicol skeleton: `column-fill: auto` only wraps into the next
 * column when the box has a definite block size; min-height alone grows one column.
 */
export const NEWSPAPER_SKELETON_FRAME = {
  height: "min(70vh, 560px)",
  minHeight: "min(70vh, 560px)",
  overflow: "hidden" as const,
};
