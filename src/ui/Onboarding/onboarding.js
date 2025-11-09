async function loadFactions() {
  const container = document.getElementById("faction-container");
  const factionDir = "../../data/factions/";
  
  const factions = [
    "crimson_horde.json",
    "devoured_faith.json",
    "spider_court.json",
    "meadowfolk_union.json",
    "jade_empire.json",
    "mycelid_monarchy.json"
  ];

  for (const file of factions) {
    const res = await fetch(factionDir + file);
    const faction = await res.json();

    const card = document.createElement("div");
    card.className = "faction-card";
    card.style.border = `2px solid ${faction.palette[0]}`;

    card.innerHTML = `
      <div class="faction-emoji">${faction.emoji}</div>
      <div class="faction-name">${faction.name}</div>
      <div class="faction-overview">${faction.overview}</div>
    `;

    container.appendChild(card);
  }
}

loadFactions();
