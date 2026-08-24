/**
 * Remove duplicate campus rows (same id or same name, case-insensitive).
 */
export const dedupeCampuses = (campuses = []) => {
  const byId = new Map();
  const byName = new Map();

  for (const campus of campuses) {
    if (!campus?.id) continue;
    if (byId.has(campus.id)) continue;

    const nameKey = String(campus.name || '').trim().toLowerCase();
    if (nameKey && byName.has(nameKey)) continue;

    byId.set(campus.id, campus);
    if (nameKey) byName.set(nameKey, campus);
  }

  return Array.from(byId.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
};
