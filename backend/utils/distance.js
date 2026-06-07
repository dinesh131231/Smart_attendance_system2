export function euclideanDistance(d1, d2) {
  return Math.sqrt(
    d1.reduce((sum, val, i) => sum + (val - d2[i]) ** 2, 0)
  );
}