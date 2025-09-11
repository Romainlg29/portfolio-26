export const lerp = (a: number, b: number, t: number) => {
  // Linear interpolation between a and b
  return a + (b - a) * t;
};
