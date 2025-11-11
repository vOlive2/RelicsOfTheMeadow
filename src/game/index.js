import factions from "../../data/factions.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Factions loaded:", factions.map(f => f.name));

  const selectedFaction = factions.find(f => f.name === "The Crimson Horde"); // later we’ll make this dynamic
  renderFactionInfo(selectedFaction);
});

function renderFactionInfo(faction) {
  const hud = document.getElementById("hud");
  hud.innerHTML = `
    <div id="faction-info" class="faction-card">
      <h2>${faction.emoji} ${faction.name}</h2>
      <p>${faction.overview}</p>
      <p><strong>Prowess:</strong> ${faction.defaultTraits.prowess} | 
         <strong>Resilience:</strong> ${faction.defaultTraits.resilience} | 
         <strong>Economy:</strong> ${faction.defaultTraits.economy}</p>
      <p><strong>Starting Relic:</strong> ${faction.startingRelic}</p>
      <button id="show-abilities">Faction Abilities</button>
    </div>

    <div id="faction-abilities" class="abilities-tab hidden"></div>

    <div id="actions">
      <button>Battle</button>
      <button>Declare War</button>
      <button>Offer Alliance</button>
      <button>Fortify</button>
      <button>Build</button>
      <button>Manage Trade</button>
      <button>Use Relic</button>
      <button>End Turn</button>
    </div>
  `;

  // Add event for "Faction Abilities" tab
  document.getElementById("show-abilities").addEventListener("click", () => {
    toggleFactionAbilities(faction);
  });
}

function toggleFactionAbilities(faction) {
  const tab = document.getElementById("faction-abilities");
  tab.classList.toggle("hidden");

  if (!tab.classList.contains("hidden")) {
    const abilities = flattenAbilities(faction.specialMechanic);
    tab.innerHTML = `
      <h3>${faction.emoji} ${faction.name} Abilities</h3>
      ${abilities
        .map(
          (a) => `
        <div class="ability">
          <strong>${a.name}</strong> - ${a.desc} 
          ${a.cost > 0 ? `<em>(Cost: ${a.cost} gold)</em>` : ""}
        </div>
      `
        )
        .join("")}
    `;
  }
}

function flattenAbilities(specialMechanic) {
  const flat = [];
  for (const phase in specialMechanic) {
    for (const abilityName in specialMechanic[phase]) {
      const ability = specialMechanic[phase][abilityName];
      flat.push({ name: abilityName, ...ability });
    }
  }
  return flat;
}
