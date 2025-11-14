////////////////////////////////
///          IMPORTS         ///
////////////////////////////////
import { factions } from "../../data/factions.js";
import buildings from "../../data/buildings.js";
import { calculateResilience, calculateEconomy, calculateProwess, calcStartingEnergy } from "../utils/statCalc.js";
import { importItems } from "../../data/importItems.js";
console.log("✅ Game JS loaded!");


////////////////////////////////
///        TURN ORDER        ///
////////////////////////////////
function updateDerivedStats() {
  player.resilience = calculateResilience(player);
  player.economy = calculateEconomy(player);
  player.prowess = calculateProwess(player);
}

function renderHUD() {
  const f = player.faction;
  document.getElementById("factionDisplay").textContent = `${f.emoji} ${f.name}`;
  updateDerivedStats();
  document.getElementById("factionList").innerHTML = `
    <p>💖 Happiness: ${player.happiness}</p> <br>
    <p>🛡️ Protection: ${player.protection}</p> <br>
    <p>💰 Gold: ${player.gold}</p> <br>
    <br>
    <p>💪 Prowess: ${player.prowess}/10</p> <br>
    <p>🧱 Resilience: ${player.resilience}/10</p> <br>
    <p>📊 Economy: ${player.economy}/10</p> <br>
    ⚡ Energy: ${player.energy}
  `;
}

// 🎮 Handle action logic
function handleAction(action) {
  switch (action) {
    case "declare-war":
      spendEnergyAndGold(4, 50, "Declared war! Troop count increased.", () => player.troops += 10);
      break;
    case "battle":
      spendEnergyAndGold(2, 0, "Fought a battle! Gained troops and protection, lost happiness", () => {
        player.troops += 10;
        player.protection = Math.max(0, player.protection + 1);
        player.happiness = Math.max(0, player.happiness - 1);
      });
      break;
    case "build":
      buildMenu();
      break;
    case "trade":
      if(player.canTrade) {
        player.canTrade = false;  
        let num = Math.floor(Math.random() * 15) + 1;
        spendEnergyAndGold(1, 0, "Trade complete! Gained "+num+" gold", () => player.gold += num);      } else {
        logEvent("You have already tradeed this turn!");
      }
      break;
    case "collect":
      if(player.imports > 0) {
        player.imports--;
        let bonus = ["", "", "", ""];
        let importItem = importItems[Math.floor(Math.random() * 15)];
        if (selected.statBoosts.happiness) {player.happiness += selected.statBoosts.happiness; bonus[0] = selected.statBoosts.happiness + " happiness";}
        if (selected.statBoosts.protection) {player.protection += selected.statBoosts.protection; bonus[1] = selected.statBoosts.protection + " protection";}
        if (selected.statBoosts.troops) {player.troops += selected.statBoosts.troops; bonus[2] = selected.statBoosts.troops + " troops";}
        if (selected.statBoosts.energy) {player.energy += selected.statBoosts.energy; bonus[3] = selected.statBoosts.energy + " energy";}
        spendEnergyAndGold(0, 0, "Collected imported "+importItem.name+"! Gained "+importItem.price+" gold and a bonus of "+bonus[0]+bonus[1]+bonus[2]+bonus[3] + "!", () => player.gold += importItem.price);
      } else {
        logEvent("No imports to collect!");
      }
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
    ((b.availableTo === "all" || b.availableTo.includes(player.faction.name)) && player.buildings.incudes(b.preRec)));
  const choice = prompt(
    `Choose building:\n${available
      .map((b, i) => `${i + 1}. ${b.name} —— 💰${b.cost.gold}, ⚡${b.cost.energy} —— {player.buildings.filter(item => item === b.name).length} built`)
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

// 🧠 NEED TO UPDATE/REMOVE - BUTTONS WILL DISPLAY AT START OF GAME AND NOT IN LIST
function showFactionAbilities() {
  const abilities = player.faction.abilities;
  logEvent(`🧠 ${player.faction.name}'s Abilities:`);
  abilities.forEach(a => logEvent(`• ${a.name}: ${a.desc} (Cost: ${a.cost})`));
}

function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// 🌙 End turn
function endTurn() {
  player.energy = calcStartingEnergy(player.faction);
  logEvent("🌙 Turn ended. Energy restored!");
  player.canTrade = true;
  player.imports = Math.floor(Math.random() * 5) + 1;
  renderHUD();
}

////////////////////////////////
///      INITIALIZATION      ///
////////////////////////////////
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
  imports: 0,
  canTrade: true,
  relics: [],
  buildings: [],
};
// 🌅 Start game after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
}); 

function startGame(faction) {
  player.faction = faction;
  player.energy = calcStartingEnergy(player);
  player.gold = parseInt(faction.defaultTraits.economy) * 250;
  player.troops = parseInt(faction.defaultTraits.prowess) * 10;
  player.happiness = 1;
  player.protection = 1;
  player.imports = Math.floor(Math.random() * 5) + 1;
  player.relics = [faction.startingRelic || "None"];
  player.buildings = [];
  updateDerivedStats();
  renderHUD();
  setupActionButtons();
  logEvent(`🌿 Welcome, ${faction.name}!`);
}

function setupActionButtons() {
  const actionArea = document.getElementById("actionButtons");
  actionArea.innerHTML = "";
  const actions = [
    { id: "declare-war", label: "⚔️ Declare War" },
    { id: "battle", label: "🛡️ Battle" },
    { id: "build", label: "🔨 Build" },
    { id: "trade", label: "📦 Trade" },
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
