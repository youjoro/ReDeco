export function snap(val, grid) {
  return grid ? Math.round(val / grid) * grid : val;
}
