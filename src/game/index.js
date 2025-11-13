console.log("✅ Game JS loaded!");

// import faction data
import { factions } from "../../data/factions.js";

// 🧍 Player data
let player = {
  faction: null,
  energy: 0,
  gold: 0,
  prowess: 0,
  resilience: 0,
  relics: [],
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
  player.gold = parseInt(faction.defaultTraits.economy); // economy = gold
  player.prowess = parseInt(faction.defaultTraits.prowess);
  player.resilience = parseInt(faction.defaultTraits.resilience);
  player.relics = [faction.startingRelic || "None"];

  renderHUD();
  setupActionButtons();
  logEvent(`🌿 Welcome, ${faction.name}!`);
}

// ⚙️ Calculate starting energy
function calcStartingEnergy(faction) {
  const t = faction.defaultTraits;
  const avg = (parseInt(player.prowess) + parseInt(player.resilience) + parseInt(player.economy)) / 3;
  return Math.ceil(avg);
}

// 🧱 Render HUD
function renderHUD() {
  const f = player.faction;
  document.getElementById("factionDisplay").textContent = `${f.emoji} ${f.name}`;

  document.getElementById("factionList").innerHTML = `
    🗡️ Prowess: ${player.prowess}/10 |\n
    🌱 Resilience: ${player.resilience}/10 |\n
    💰 Gold: ${player.gold} |\n
    ⚡ Energy: ${player.energy}\n
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
    { id: "trade", label: "💰 Collect Imports" },
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
      spendEnergyAndGold(4, 50, "Declared war! Prowess increased slightly.", () => player.prowess += 1);
      break;
    case "battle":
      spendEnergyAndGold(2, 0, "Fought a battle! Prowess increased, but resilience fell slightly.", () => {
        player.prowess += 1;
        player.resilience = Math.max(1, player.resilience - 1);
      });
      break;
    case "fortify":
      spendEnergyAndGold(1, 25, "Fortified your lands! Resilience increased!", () => player.resilience += 1);
      break;
    case "build":
      spendEnergyAndGold(1, 15, "Constructed a structure! Economy increased!", () => player.gold += 10);
      break;
    case "trade":
      spendEnergyAndGold(0, 0, "Successful trade! Earned gold!", () => player.gold += 20);
      break;
    case "use-relic":
      logEvent(`You invoked ${player.relics.join(", ")}! Magical effects swirl...`);
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
