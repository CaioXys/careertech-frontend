export function getDemoCourseProgress(courseId) {
  const numericId = Number(courseId);
  const stableId = Number.isFinite(numericId) ? Math.abs(Math.trunc(numericId)) : 0;
  return 30 + ((stableId * 17 + 11) % 60);
}
