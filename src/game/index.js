import { factions } from "../../data/factions.js";
import { relics } from "../../data/relics.js";

let player = {
  faction: null,
  energy: 0,
  gold: 0,
  relics: [],
};

// 🌅 Start once page fully loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Factions loaded:", factions.map(f => f.name));

  // 🪞 Get chosen faction or default to first one
  const selectedName = localStorage.getItem("chosenFaction");
  const startingFaction = factions.find(f => f.name === selectedName) || factions[0];

  if (!startingFaction) {
    console.error("❌ No factions found! Check factions.js");
    return;
  }

  startGame(startingFaction);
});

// 🎮 Begin the game for chosen faction
function startGame(faction) {
  player.faction = faction;
  player.energy = calcStartingEnergy(faction);
  player.gold = 200;

  // 🧿 Find all relics belonging to this faction
  const factionRelics = relics.filter(
    r => r.type === faction.name || r.type === faction.emoji
  );

  // ✅ Store relic names or fallback to “None”
  player.relics = factionRelics.length
    ? factionRelics.map(r => r.name)
    : ["None"];

  console.log(`🎯 Starting as ${faction.name} with relics: ${player.relics}`);

  renderHUD();
  setupActionButtons();
}

// ⚡ Calculate energy based on faction traits
function calcStartingEnergy(faction) {
  const { prowess, resilience, economy } = faction.defaultTraits || {};
  if (prowess == null || resilience == null || economy == null) return 5; // fallback
  return Math.ceil((Number(prowess) + Number(resilience) + Number(economy)) / 3);
}

// 🧠 Draw HUD data
function renderHUD() {
  const f = player.faction;
  if (!f) return;

  const relicList = Array.isArray(player.relics)
    ? player.relics.join(", ")
    : "None";

  document.getElementById("faction-name").textContent = `${f.emoji || "🏳️"} ${f.name}`;
  document.getElementById("stats").textContent = 
    `Prowess: ${f.defaultTraits?.prowess ?? "?"} | Resilience: ${f.defaultTraits?.resilience ?? "?"} | Economy: ${f.defaultTraits?.economy ?? "?"}`;
  document.getElementById("relics").textContent = `Relics: ${relicList}`;
  document.getElementById("energy").textContent = `Energy: ${player.energy} ⚡ | Gold: ${player.gold} 💰`;
}

// 🕹️ Setup buttons
function setupActionButtons() {
  document.querySelectorAll("#actions button").forEach(btn => {
    const action = btn.dataset.action;
    btn.addEventListener("click", () => handleAction(action));
  });
}

// 💥 Handle game actions
function handleAction(action) {
  switch (action) {
    case "declare-war":
      spendEnergyAndGold(5, 100, "Declared war! Loot potential increased.");
      break;
    case "battle":
      spendEnergyAndGold(1, 0, "Engaged in battle!");
      break;
    case "fortify":
      spendEnergyAndGold(0, 50, "Fortified your structures.");
      break;
    case "build":
      spendEnergyAndGold(0, 25, "Constructed a new building!");
      break;
    case "trade":
      logEvent("Opened trade management.");
      break;
    case "use-relic":
      logEvent(`You invoked ${player.relics.join(", ")}!`);
      break;
    case "faction-abilities":
      logEvent(`Viewing ${player.faction.name}'s abilities.`);
      break;
    case "end-turn":
      endTurn();
      break;
    default:
      logEvent("🤨 Unknown action.");
  }
  renderHUD();
}

// 💸 Spend resources
function spendEnergyAndGold(energyCost, goldCost, successMsg) {
  if (player.energy < energyCost) {
    logEvent("❌ Not enough energy!");
    return;
  }
  if (player.gold < goldCost) {
    logEvent("❌ Not enough gold!");
    return;
  }

  player.energy -= energyCost;
  player.gold -= goldCost;
  logEvent(`✅ ${successMsg}`);
}

// 🌙 End of turn
function endTurn() {
  logEvent("🌙 Turn ended. Energy restored!");
  player.energy = calcStartingEnergy(player.faction);
}

// 🪶 Log events to UI
function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
