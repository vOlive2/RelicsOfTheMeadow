////////////////////////////////
///          IMPORTS         ///
////////////////////////////////
import { factions } from "../../data/factions.js";
import buildings from "../../data/buildings.js";
import { calculateResilience, calculateEconomy, calculateProwess, calcStartingEnergy } from "../utils/statCalc.js";
import { importItems } from "../../data/importItems.js";
import { battleSpoils } from "../../data/spoils.js";
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

function chooseOpponent(actionLabel, filterFn = () => true) {
  const others = factions.filter(
    f => f.name !== player.faction.name && filterFn(f)
  );
  if (!others.length) {
    logEvent(`No factions available to ${actionLabel}.`);
    return null;
  }
  const promptMsg = `Select a faction to ${actionLabel}:\n${others
    .map((f, i) => `${i + 1}. ${f.emoji} ${f.name}`)
    .join("\n")}`;
  const choice = prompt(promptMsg);
  if (!choice) {
    logEvent("Selection cancelled.");
    return null;
  }
  const index = parseInt(choice, 10) - 1;
  const selectedFaction = others[index];
  if (!selectedFaction) {
    logEvent("❌ Invalid faction choice.");
    return null;
  }
  return selectedFaction;
}

function grantBattleSpoils(targetFaction, atWar) {
  if (!battleSpoils || !battleSpoils.length) return;
  const spoils = battleSpoils[Math.floor(Math.random() * battleSpoils.length)];
  const multiplier = atWar ? 2 : 1;
  const gains = [];
  const goldGain = (spoils.price || 0) * multiplier;
  if (goldGain) {
    player.gold += goldGain;
    gains.push(`${goldGain} gold`);
  }
  const boosts = spoils.statBoosts || {};
  Object.keys(boosts).forEach(stat => {
    const value = boosts[stat] * multiplier;
    if (!value || typeof player[stat] !== "number") return;
    player[stat] += value;
    gains.push(`${value} ${stat}`);
  });
  const warNote = atWar ? " (war spoils doubled!)" : "";
  const rewardText = gains.length ? gains.join(", ") : "No tangible gains";
  logEvent(`🏴‍☠️ Claimed ${spoils.name}${warNote} against ${targetFaction.name}. ${rewardText}.`);
}

// 🎮 Handle action logic
function handleAction(action) {
  switch (action) {
    case "declare-war": {
      const targetFaction = chooseOpponent("declare war on");
      if (!targetFaction) break;
      if (player.declaredWars.includes(targetFaction.name)) {
        logEvent(`Already at war with ${targetFaction.name}.`);
        break;
      }
      spendEnergyAndGold(
        4,
        50,
        `Declared war on ${targetFaction.name}! Troop count increased.`,
        () => {
          player.troops += 10;
          player.declaredWars.push(targetFaction.name);
        }
      );
      break;
    }
    case "battle": {
      const targetFaction = chooseOpponent("battle");
      if (!targetFaction) break;
      const atWar = player.declaredWars.includes(targetFaction.name);
      spendEnergyAndGold(
        2,
        0,
        `Fought ${targetFaction.name}! Gained troops and protection, lost happiness`,
        () => {
          player.troops += 10;
          player.protection = Math.max(0, player.protection + 1);
          player.happiness = Math.max(0, player.happiness - 1);
          grantBattleSpoils(targetFaction, atWar);
        }
      );
      break;
    }
    case "build":
      buildMenu();
      break;
    case "trade":
      if (player.canTrade) {
        player.canTrade = false;
        const num = Math.floor(Math.random() * 15) + 1;
        spendEnergyAndGold(1, 0, `Trade complete! Gained ${num} gold`, () => (player.gold += num));
      } else {
        logEvent("You have already traded this turn!");
      }
      break;
    case "collect":
      if (player.imports > 0) {
        player.imports--;
        const importItem = importItems[Math.floor(Math.random() * importItems.length)];
        const bonuses = [];
        if (importItem.statBoosts.happiness) {
          player.happiness += importItem.statBoosts.happiness;
          bonuses.push(`${importItem.statBoosts.happiness} happiness`);
        }
        if (importItem.statBoosts.protection) {
          player.protection += importItem.statBoosts.protection;
          bonuses.push(`${importItem.statBoosts.protection} protection`);
        }
        if (importItem.statBoosts.troops) {
          player.troops += importItem.statBoosts.troops;
          bonuses.push(`${importItem.statBoosts.troops} troops`);
        }
        if (importItem.statBoosts.energy) {
          player.energy += importItem.statBoosts.energy;
          bonuses.push(`${importItem.statBoosts.energy} energy`);
        }
        const bonusMsg = bonuses.length ? ` and bonus ${bonuses.join(", ")}` : "";
        spendEnergyAndGold(
          0,
          0,
          `Collected imported ${importItem.name}! Gained ${importItem.price} gold${bonusMsg}!`,
          () => (player.gold += importItem.price)
        );
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
  const available = buildings.filter(b => {
    const factionAllowed =
      b.availableTo === "all" ||
      (Array.isArray(b.availableTo) && b.availableTo.includes(player.faction.name));
    if (!factionAllowed) return false;
    if (!b.preRec || b.preRec === "none") return true;
    return player.buildings.includes(b.preRec);
  });

  if (!available.length) {
    logEvent("No buildings available right now.");
    return;
  }

  const choice = prompt(
    `Choose building:\n${available
      .map(
        (b, i) =>
          `${i + 1}. ${b.name} —— 💰${b.cost.gold}, ⚡${b.cost.energy} —— ${
            player.buildings.filter(item => item === b.name).length
          } built`
      )
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
  player.energy = calcStartingEnergy(player);
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
  declaredWars: [],
};
// 🌅 Start game after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
}); 

function startGame(faction) {
  player.faction = faction;
  player.gold = parseInt(faction.defaultTraits.economy, 10) * 250;
  player.troops = parseInt(faction.defaultTraits.prowess, 10) * 10;
  player.happiness = 1;
  player.protection = 1;
  player.imports = Math.floor(Math.random() * 5) + 1;
  player.relics = [faction.startingRelic || "None"];
  player.buildings = [];
  player.declaredWars = [];
  updateDerivedStats();
  player.energy = calcStartingEnergy(player);
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
