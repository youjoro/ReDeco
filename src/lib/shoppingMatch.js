// Matches a canvas furniture item's free-text label (e.g. "wooden chair",
// a Pixabay tag, or an uploaded filename) to a catalog row.
//
// Strategy:
//   1. Score every catalog item by how many words overlap with its
//      name/tags — pick the best match if there is any overlap at all.
//   2. If nothing overlaps, fall back to a deterministic pick based on a
//      hash of the label, so the SAME item always resolves to the SAME
//      product (rather than a new random pick every time it's re-added).
export function matchFurnitureToCatalog(label = "", catalog = []) {
  if (!catalog.length) return null;

  const words = label.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  let best = null;
  let bestScore = 0;

  for (const item of catalog) {
    const haystack = [item.name, ...(item.tags || [])].join(" ").toLowerCase();
    const score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best) return best;

  // Deterministic fallback — same label always lands on the same item
  const hash = [...label].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return catalog[hash % catalog.length];
}
