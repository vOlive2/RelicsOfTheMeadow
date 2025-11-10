// src/utils/fileLoader.js
// Browser-friendly loader that fetches JSON or JS data from /data

// Load all factions dynamically from /data/factions/
export async function loadFactions() {
  const factionFiles = [
    "crimson_horde.json",
    "devoured_faith.json",
    "jade_empire.json",
    "meadowfolk_union.json",
    "mycelial_monarchy.json",
    "silken_dominion.json",
  ];

  const results = [];

  for (const file of factionFiles) {
    try {
      const resp = await fetch(`./data/factions/${file}`);
      if (!resp.ok) throw new Error(`Failed to fetch ${file}: ${resp.status}`);
      const json = await resp.json();

      // Normalize: ensure name & overview exist
      results.push({
        key: file.replace(".json", ""),
        name: json.name || json.title || file.replace(".json", ""),
        overview: json.overview || json.overviewLore || json.description || "",
        emoji: json.emoji || "",
        raw: json,
      });
    } catch (err) {
      console.error(err);
    }
  }

  return results;
}

// Load relics from data/relics.js
export async function loadRelics() {
  try {
    // Import the relics.js file directly (must use export const relics = [...])
    const module = await import("../data/relics.js");
    if (!module.relics) throw new Error("Relics not exported from relics.js");
    console.log("✅ Relics loaded:", module.relics.length);
    return module.relics;
  } catch (err) {
    console.error("❌ Failed to load relics:", err);
    return [];
  }
}
