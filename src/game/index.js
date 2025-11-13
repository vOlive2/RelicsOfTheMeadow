console.log("✅ Game JS loaded!");

// Imports
import { factions } from "../../data/factions.js";
import buildings from "../../data/buildings.js";
import { calculateResilience, calculateEconomy, calculateProwess } from "../utils/statCalc.js";

// 🧍 Player data
let player = {
  faction: null,
  energy: 0,
  gold: 0,
  troops: 0,
  happiness: 0,
  protection: 0,
  prowess: 0,
  resilience: 0,
  economy: 1,
  relics: [],
  buildings: [],
};

// 🌅 Start game after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
});

// 🏁 Initialize
function startGame(faction) {
  player.faction = faction;
  player.energy = calcStartingEnergy(faction);
  player.gold = parseInt(faction.defaultTraits.economy);
  player.troops = parseInt(faction.defaultTraits.prowess) * 10;
  player.happiness = 1;
  player.protection = 1;
  player.relics = [faction.startingRelic || "None"];
  player.buildings = [];

  updateDerivedStats();
  renderHUD();
  setupActionButtons();
  logEvent(`🌿 Welcome, ${faction.name}!`);
}

// ⚙️ Calculate starting energy
function calcStartingEnergy(faction) {
  const avg = (player.prowess + player.resilience + player.economy) / 3;
  return Math.ceil(avg);
}

// 🧠 Recalculate resilience, economy, prowess
function updateDerivedStats() {
  player.resilience = calculateResilience(player);
  player.economy = calculateEconomy(player.gold);
  player.prowess = calculateProwess(player);
}

// 🧱 Render HUD
function renderHUD() {
  const f = player.faction;
  document.getElementById("factionDisplay").textContent = `${f.emoji} ${f.name}`;
  updateDerivedStats();

  document.getElementById("factionList").innerHTML = `
    💖 Happiness: ${player.happiness} \n
    🛡️ Protection: ${player.protection} \n
    💪 Prowess: ${player.prowess}/10 \n
    🧱 Resilience: ${player.resilience}/10 \n
    💰 Gold: ${player.gold} \n
    📊 Economy: ${player.economy}/10 \n
    ⚡ Energy: ${player.energy}
  `;
}

// ⚔️ Create action buttons
function setupActionButtons() {
  const actionArea = document.getElementById("actionButtons");
  actionArea.innerHTML = "";

  const actions = [
    { id: "declare-war", label: "⚔️ Declare War" },
    { id: "battle", label: "🛡️ Battle" },
    { id: "fortify", label: "🏰 Fortify" },
    { id: "build", label: "🔨 Build" },
    { id: "trade", label: "📦 Choose Export" },
    { id: "collect", label: "💰 Collect Imports" },
    { id: "use-relic", label: "🔮 Use Relic" },
    { id: "faction-abilities", label: "🧠 Abilities" },
  ];

  actions.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a.label;
    btn.dataset.action = a.id;
    btn.addEventListener("click", () => handleAction(a.id));
    actionArea.appendChild(btn);
  });

  document.getElementById("endTurnBtn").addEventListener("click", () => handleAction("end-turn"));
}

// 🎮 Handle action logic
function handleAction(action) {
  switch (action) {
    case "declare-war":
      spendEnergyAndGold(4, 50, "Declared war! Troop count increased.", () => player.troops += 10);
      break;
    case "battle":
      spendEnergyAndGold(2, 0, "Fought a battle! Gained troops, lost protection.", () => {
        player.troops += 10;
        player.protection = Math.max(0, player.protection - 1);
      });
      break;
    case "fortify":
      spendEnergyAndGold(1, 25, "Fortified! Protection increased.", () => player.protection += 1);
      break;
    case "build":
      buildMenu();
      break;
    case "trade":
      spendEnergyAndGold(0, 0, "Trade successful! Earned gold.", () => player.gold += 20);
      break;
    case "collect":
      spendEnergyAndGold(0, 0, "Collected imports! Gained 30 gold.", () => player.gold += 30);
      break;
    case "use-relic":
      logEvent(`You used ${player.relics.join(", ")}! Magic surges...`);
      player.energy += 2;
      break;
    case "faction-abilities":
      showFactionAbilities();
      break;
    case "end-turn":
      endTurn();
      break;
  }

  renderHUD();
}

// 🧱 Show build menu
function buildMenu() {
  const available = buildings.filter(b =>
    b.availableTo === "all" || b.availableTo.includes(player.faction.name)
  );

  const choice = prompt(
    `Choose building:\n${available
      .map((b, i) => `${i + 1}. ${b.name} — 💰${b.cost.gold}, ⚡${b.cost.energy}`)
      .join("\n")}`
  );

  const index = parseInt(choice) - 1;
  const selected = available[index];

  if (!selected) return logEvent("❌ Invalid choice.");

  spendEnergyAndGold(
    selected.cost.energy,
    selected.cost.gold,
    `Built ${selected.name}!`,
    () => {
      player.buildings.push(selected.name);
      if (selected.statBoosts.happiness) player.happiness += selected.statBoosts.happiness;
      if (selected.statBoosts.protection) player.protection += selected.statBoosts.protection;
      if (selected.statBoosts.gold) player.gold += selected.statBoosts.gold;
    }
  );
}

// 💸 Spend energy + gold, apply effects
function spendEnergyAndGold(energyCost, goldCost, msg, onSuccess) {
  if (player.energy < energyCost) return logEvent("❌ Not enough energy!");
  if (player.gold < goldCost) return logEvent("❌ Not enough gold!");

  player.energy -= energyCost;
  player.gold -= goldCost;
  logEvent(`✅ ${msg}`);
  if (onSuccess) onSuccess();
}

// 🌙 End turn
function endTurn() {
  player.energy = calcStartingEnergy(player.faction);
  logEvent("🌙 Turn ended. Energy restored!");
  renderHUD();
}

// 🧠 Show abilities from faction data
function showFactionAbilities() {
  const abilities = player.faction.abilities;
  logEvent(`🧠 ${player.faction.name}'s Abilities:`);
  abilities.forEach(a => logEvent(`• ${a.name}: ${a.desc} (Cost: ${a.cost})`));
}

// 🪶 Log events to UI
function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
