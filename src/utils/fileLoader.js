// src/utils/fileLoader.js
// Browser-friendly loader that fetches JSON files from /data

export async function loadFactions() {
  const factionFiles = [
    "crimson_horde.json",
    "devoured_faith.json",
    "jade_empire.json",
    "meadowfolk_union.json",
    "mycelid_monarchy.json",
    "spider_court.json",
  ];

  const results = [];

  for (const file of factionFiles) {
    try {
      const resp = await fetch(`./data/factions/${file}`);
      if (!resp.ok) throw new Error(`Failed to fetch ${file}: ${resp.status}`);
      const json = await resp.json();
      // normalize: ensure name & overview exist
      results.push({
        key: file.replace('.json', ''),
        name: json.name || json.title || file.replace('.json',''),
        overview: json.overview || json.overviewLore || json.description || "",
        emoji: json.emoji || "",
        raw: json
      });
    } catch (err) {
      console.error(err);
    }
  }

  return results;
}
