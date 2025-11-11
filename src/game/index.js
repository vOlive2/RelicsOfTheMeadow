import { factions } from "../../data/factions.js";

let player = {
  faction: null,
  energy: 0,
  gold: 0,
  relics: [],
};

// === INITIALIZE GAME ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Factions loaded:", factions.map(f => f.name));
  // Load player’s chosen faction or default to Crimson Horde
  const chosenName = localStorage.getItem("selectedFaction") || "The Crimson Horde";
  const startingFaction = factions.find(f => f.name === chosenName);
  startGame(startingFaction);
});

// === START GAME WITH SELECTED FACTION ===
function startGame(faction) {
  player.faction = faction;
  player.energy = calcStartingEnergy(faction);
  player.gold = 200; // default starting gold
  player.relics = [faction.startingRelic];

  renderHUD();
  setupActionButtons();
}

function calcStartingEnergy(faction) {
  // Convert "9/10" → 9
  const parseStat = (s) => parseInt(s.split("/")[0]) || 0;
  const { prowess, resilience, economy } = faction.defaultTraits;
  return Math.ceil((parseStat(prowess) + parseStat(resilience) + parseStat(economy)) / 3);
}

// === RENDER HUD INFO ===
function renderHUD() {
  const f = player.faction;
  document.getElementById("faction-name").textContent = `${f.emoji} ${f.name}`;
  document.getElementById(
    "stats"
  ).textContent = `⚔️ Prowess: ${f.defaultTraits.prowess} | 🛡️ Resilience: ${f.defaultTraits.resilience} | 💰 Economy: ${f.defaultTraits.economy}`;
  document.getElementById("relics").textContent = `Relics: ${player.relics.join(", ")}`;
  document.getElementById("energy").textContent = `Energy: ${player.energy} ⚡ | Gold: ${player.gold} 💰`;
}

// === SET UP ACTION BUTTONS ===
function setupActionButtons() {
  document.querySelectorAll("#actions button").forEach((btn) => {
    const action = btn.dataset.action;
    btn.addEventListener("click", () => handleAction(action));
  });

  // Popup close buttons
  document.getElementById("close-trade").addEventListener("click", () => togglePopup("trade-popup", false));
  document.getElementById("close-faction").addEventListener("click", () => togglePopup("faction-popup", false));
}

// === ACTION HANDLERS ===
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
      togglePopup("trade-popup", true);
      break;
    case "use-relic":
      logEvent(`You invoked ${player.relics.join(", ")}!`);
      break;
    case "faction-abilities":
      showFactionAbilities(player.faction);
      break;
    case "end-turn":
      endTurn();
      break;
  }
  renderHUD();
}

// === POPUPS ===
function togglePopup(id, show = true) {
  const popup = document.getElementById(id);
  popup.classList.toggle("hidden", !show);
}

function showFactionAbilities(faction) {
  const list = document.getElementById("faction-abilities-list");

  list.innerHTML = faction.abilities
    .map(
      (a) => `
      <div class="ability">
        <strong>${a.name}</strong> — ${a.desc}
        ${a.cost > 0 ? `<em>(Cost: ${a.cost}💰)</em>` : ""}
      </div>
    `
    )
    .join("");

  togglePopup("faction-popup", true);
}

// === ENERGY & GOLD SPENDING ===
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

// === END TURN ===
function endTurn() {
  logEvent("🌙 Turn ended. Energy restored!");
  player.energy = calcStartingEnergy(player.faction);
}

// === EVENT LOGGING ===
function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
