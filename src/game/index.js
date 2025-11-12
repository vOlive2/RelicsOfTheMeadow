console.log("✅ Game JS loaded!");

// You can uncomment these when running as modules
// import { factions } from "../../data/factions.js";
// import { relics } from "../../data/relics.js";

const factions = [
  { name: "The Crimson Horde", emoji: "🐺", defaultTraits: { prowess: 9, resilience: 2, economy: 4 } },
  { name: "The Silken Dominion", emoji: "🕷️", defaultTraits: { prowess: 3, resilience: 6, economy: 6 } },
  { name: "The Meadowfolk Union", emoji: "🌼", defaultTraits: { prowess: 5, resilience: 5, economy: 5 } },
  { name: "The Jade Empire", emoji: "🐉", defaultTraits: { prowess: 3, resilience: 4, economy: 8 } },
  { name: "The Mycelial Monarchy", emoji: "🍄", defaultTraits: { prowess: 5, resilience: 8, economy: 3 } },
  { name: "The Devoured Faith", emoji: "⛪", defaultTraits: { prowess: 6, resilience: 6, economy: 3 } }
];

let player = {
  faction: null,
  energy: 0,
  gold: 0,
  relics: [],
};

document.addEventListener("DOMContentLoaded", () => {
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
});

function startGame(faction) {
  player.faction = faction;
  player.energy = calcStartingEnergy(faction);
  player.gold = 200;
  player.relics = ["Starter Relic"];

  renderHUD();
  setupActionButtons();
}

function calcStartingEnergy(faction) {
  const t = faction.defaultTraits;
  return Math.ceil((t.prowess + t.resilience + t.economy) / 3);
}

function renderHUD() {
  const f = player.faction;
  document.getElementById("factionDisplay").textContent = `${f.emoji} ${f.name}`;
  document.getElementById("factionList").textContent =
    `Prowess: ${f.defaultTraits.prowess} | Resilience: ${f.defaultTraits.resilience} | Economy: ${f.defaultTraits.economy}`;
}

function setupActionButtons() {
  const actionArea = document.getElementById("actionButtons");
  actionArea.innerHTML = "";

  const actions = [
    { id: "declare-war", label: "⚔️ Declare War" },
    { id: "battle", label: "🛡️ Battle" },
    { id: "fortify", label: "🏰 Fortify" },
    { id: "build", label: "🔨 Build" },
    { id: "trade", label: "💰 Trade" },
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

  // Link footer End Turn button
  document.getElementById("endTurnBtn").addEventListener("click", () => handleAction("end-turn"));
}

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
  }
  renderHUD();
}

function spendEnergyAndGold(energyCost, goldCost, msg) {
  if (player.energy < energyCost) return logEvent("❌ Not enough energy!");
  if (player.gold < goldCost) return logEvent("❌ Not enough gold!");

  player.energy -= energyCost;
  player.gold -= goldCost;
  logEvent(`✅ ${msg} (-${energyCost}⚡, -${goldCost}💰)`);
}

function endTurn() {
  player.energy = calcStartingEnergy(player.faction);
  logEvent("🌙 Turn ended. Energy restored!");
}

function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
