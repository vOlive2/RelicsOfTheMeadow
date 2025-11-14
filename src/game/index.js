/////////////////////////////////////
///        MODULE IMPORTS         ///
/////////////////////////////////////
import { factions } from "../../data/factions.js";
import buildings from "../../data/buildings.js";
import { calculateResilience, calculateEconomy, calculateProwess, calcStartingEnergy } from "../utils/statCalc.js";
import { importItems } from "../../data/importItems.js";
import { battleSpoils } from "../../data/spoils.js";
import { startPlayerGame } from "./gameSetup.js";
console.log("✅ Game JS loaded!");


/////////////////////////////////////
///      DERIVED STATS & HUD      ///
/////////////////////////////////////
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

/////////////////////////////////////
///// TARGETING & SPOILS HELPERS /////
/////////////////////////////////////
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

/////////////////////////////////////
///      DIPLOMACY MENU LOGIC     ///
/////////////////////////////////////
let diplomacyModal = null;
let diplomacyList = null;
function showDiplomacyMenu() {
  if (!diplomacyModal || !diplomacyList) return;
  renderDiplomacyMenu();
  diplomacyModal.classList.add("open");
}
function hideDiplomacyMenu() {
  if (diplomacyModal) {
    diplomacyModal.classList.remove("open");
  }
}
function renderDiplomacyMenu() {
  if (!diplomacyList) return;
  diplomacyList.innerHTML = "";
  const others = factions.filter(f => f.name !== player.faction.name);
  others.forEach(faction => {
    const isAlly = player.alliances.includes(faction.name);
    const atWar = player.declaredWars.includes(faction.name);
    const relation = isAlly ? "🤝 Alliance" : atWar ? "⚔️ At War" : "😐 Neutral";

    const card = document.createElement("div");
    card.className = "diplomacy-faction";
    const header = document.createElement("div");
    header.innerHTML = `<strong>${faction.emoji} ${faction.name}</strong> — ${relation}`;
    card.appendChild(header);

    const actions = document.createElement("div");
    actions.className = "diplomacy-actions";

    const allianceBtn = document.createElement("button");
    allianceBtn.textContent = isAlly ? "Break Alliance" : "Offer Alliance";
    allianceBtn.addEventListener("click", () => {
      if (isAlly) {
        breakAlliance(faction);
      } else {
        offerAlliance(faction);
      }
      renderDiplomacyMenu();
    });

    const warBtn = document.createElement("button");
    if (atWar) {
      warBtn.textContent = "Offer Peace";
      warBtn.addEventListener("click", () => {
        offerPeace(faction);
        renderDiplomacyMenu();
      });
    } else {
      warBtn.textContent = "Declare War";
      warBtn.disabled = isAlly;
      warBtn.title = isAlly ? "Break the alliance first." : "";
      warBtn.addEventListener("click", () => {
        startWarWithFaction(faction);
        renderDiplomacyMenu();
      });
    }

    actions.appendChild(allianceBtn);
    actions.appendChild(warBtn);
    card.appendChild(actions);
    diplomacyList.appendChild(card);
  });
}
function offerAlliance(faction) {
  if (player.alliances.includes(faction.name)) {
    logEvent(`Already allied with ${faction.name}.`);
    return;
  }
  if (player.declaredWars.includes(faction.name)) {
    logEvent(`Cannot ally with ${faction.name} while at war. Offer peace first.`);
    return;
  }
  const accepted = Math.random() > 0.35;
  if (accepted) {
    player.alliances.push(faction.name);
    logEvent(`🤝 ${faction.name} accepted your alliance offer!`);
  } else {
    logEvent(`${faction.name} declined your request for alliance.`);
  }
}
function breakAlliance(faction) {
  if (!player.alliances.includes(faction.name)) {
    logEvent(`No alliance exists with ${faction.name}.`);
    return;
  }
  player.alliances = player.alliances.filter(name => name !== faction.name);
  logEvent(`❌ Alliance with ${faction.name} has been dissolved.`);
}
function startWarWithFaction(faction) {
  if (player.declaredWars.includes(faction.name)) {
    logEvent(`Already at war with ${faction.name}.`);
    return;
  }
  if (player.alliances.includes(faction.name)) {
    logEvent(`Break your alliance with ${faction.name} before declaring war.`);
    return;
  }
  spendEnergyAndGold(
    4,
    50,
    `Declared war on ${faction.name}! Troop count increased.`,
    () => {
      player.troops += 10;
      player.declaredWars.push(faction.name);
    }
  );
}
function offerPeace(faction) {
  if (!player.declaredWars.includes(faction.name)) {
    logEvent(`You are not currently at war with ${faction.name}.`);
    return;
  }
  const accepted = Math.random() > 0.5;
  if (accepted) {
    player.declaredWars = player.declaredWars.filter(name => name !== faction.name);
    logEvent(`🕊️ ${faction.name} accepted your peace offer. The war is over.`);
  } else {
    logEvent(`${faction.name} rejected your peace proposal. The war continues.`);
  }
}

/////////////////////////////////////
///         ACTION ROUTER         ///
/////////////////////////////////////
function handleAction(action) {
  switch (action) {
    case "diplomacy":
      showDiplomacyMenu();
      break;
    case "battle": {
      const availableTargets = factions.filter(
        f => f.name !== player.faction.name && !player.alliances.includes(f.name)
      );
      if (!availableTargets.length) {
        logEvent("All factions are presently allied with you. Break an alliance before battling.");
        break;
      }
      const targetFaction = chooseOpponent("battle", f => !player.alliances.includes(f.name));
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
/////////////////////////////////////
///     ECONOMY & LOG HELPERS     ///
/////////////////////////////////////
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
function endTurn() {
  player.energy = calcStartingEnergy(player);
  logEvent("🌙 Turn ended. Energy restored!");
  player.canTrade = true;
  player.imports = Math.floor(Math.random() * 5) + 1;
  renderHUD();
}

/////////////////////////////////////
///// PLAYER STATE & INIT /////
/////////////////////////////////////
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
  alliances: [],
  tradePostIncome: 0,
  economyBonus: 0,
};
document.addEventListener("DOMContentLoaded", () => {
  diplomacyModal = document.getElementById("diplomacyModal");
  diplomacyList = document.getElementById("diplomacyList");
  const closeBtn = document.getElementById("closeDiplomacy");
  if (closeBtn) {
    closeBtn.addEventListener("click", hideDiplomacyMenu);
  }
  if (diplomacyModal) {
    diplomacyModal.addEventListener("click", event => {
      if (event.target === diplomacyModal) hideDiplomacyMenu();
    });
  }
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
}); 
function startGame(faction) {
  startPlayerGame({
    player,
    faction,
    updateDerivedStats,
    renderHUD,
    logEvent,
    handleAction,
    renderFactionAbilities,
  });
}
