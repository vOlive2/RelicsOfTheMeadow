export async function loadFactions() {
  const factionFiles = [
    "crimson_horde.json",
    "devoured_faith.json",
    "jade_empire.json",
    "meadowfolk_union.json",
    "mycelid_monarchy.json",
    "spider_court.json",
  ];

  const factions = {};

  for (const file of factionFiles) {
    const name = file.replace(".json", "");
    const response = await fetch(`./data/factions/${file}`);
    const json = await response.json();
    factions[name] = json;
  }

  return factions;
}
