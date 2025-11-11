import { factions } from "../../data/factions.js";

let player = {
  faction: null,
  energy: 0,
  gold: 0,
  relics: [],
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Factions loaded:", factions.map(f => f.name));

  // Load the faction player picked
  const selectedName = localStorage.getItem("chosenFaction");
  const startingFaction = factions.find(f => f.name === selectedName) || factions[0];

  startGame(startingFaction);
});

function startGame(faction) {
  player.faction = faction;
  player.energy = calcStartingEnergy(faction);
  player.gold = 200;
  player.relics = [faction.startingRelic];

  renderHUD();
  setupActionButtons();
}

function calcStartingEnergy(faction) {
  const toNum = s => parseInt(s);
  const { prowess, resilience, economy } = faction.defaultTraits;
  return Math.ceil((toNum(prowess) + toNum(resilience) + toNum(economy)) / 3);
}

function renderHUD() {
  const f = player.faction;
  document.getElementById("faction-name").textContent = `${f.emoji} ${f.name}`;
  document.getElementById("stats").textContent = `Prowess: ${f.defaultTraits.prowess} | Resilience: ${f.defaultTraits.resilience} | Economy: ${f.defaultTraits.economy}`;
  document.getElementById("relics").textContent = `Relics: ${player.relics.join(", ")}`;
  document.getElementById("energy").textContent = `Energy: ${player.energy} ⚡ | Gold: ${player.gold} 💰`;
}

function setupActionButtons() {
  document.querySelectorAll("#actions button").forEach(btn => {
    const action = btn.dataset.action;
    btn.addEventListener("click", () => handleAction(action));
  });
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

function endTurn() {
  logEvent("🌙 Turn ended. Energy restored!");
  player.energy = calcStartingEnergy(player.faction);
}

function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
