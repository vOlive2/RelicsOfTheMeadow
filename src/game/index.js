/////////////////////////////////////
///        MODULE IMPORTS         ///
/////////////////////////////////////
import { factions } from "../../data/factions.js";
import buildings from "../../data/buildings.js";
import { calculateResilience, calculateEconomy, calculateProwess, calcStartingEnergy } from "../utils/statCalc.js";
import { importItems } from "../../data/importItems.js";
import { battleSpoils } from "../../data/spoils.js";
import { relics as relicLibrary } from "../../data/relics.js";
import { startPlayerGame } from "./gameSetup.js";
console.log("✅ Game JS loaded!");

const relicCatalog = new Map(relicLibrary.map(relic => [relic.name, relic]));
const factionRelics = new Map();
factions.forEach(f => {
  factionRelics.set(f.name, f.startingRelic || null);
});


/////////////////////////////////////
///      DERIVED STATS & HUD      ///
/////////////////////////////////////
function updateDerivedStats() {
  player.resilience = calculateResilience(player);
  player.economy = calculateEconomy(player);
  player.prowess = calculateProwess(player);
}

function renderHUD() {
  if (!player?.faction) return;
  const f = player.faction;
  const factionBanner = document.getElementById("factionDisplay");
  factionBanner.textContent = `${f.emoji} ${f.name}`;
  factionBanner.classList.remove("status-ally", "status-war", "status-neutral");
  if (player.declaredWars.length) {
    factionBanner.classList.add("status-war");
  } else if (player.alliances.length) {
    factionBanner.classList.add("status-ally");
  } else {
    factionBanner.classList.add("status-neutral");
  }
  updateDerivedStats();
  const leftStats = [
    { label: "💖 Happiness", value: player.happiness },
    { label: "🛡️ Protection", value: player.protection },
    { label: "🪖 Troops", value: player.troops },
    { label: "💰 Gold", value: player.gold },
  ];
  const rightStats = [
    { label: "⚡ Energy", value: player.energy },
    { label: "💪 Prowess", value: `${player.prowess}/10` },
    { label: "🧱 Resilience", value: `${player.resilience}/10` },
    { label: "📊 Economy", value: `${player.economy}/10` },
  ];
  const renderColumn = stats =>
    stats
      .map(
        stat => `
        <div class="stat-item">
          <strong>${stat.label}</strong>
          <span>${stat.value}</span>
        </div>`
      )
      .join("");
  document.getElementById("factionList").innerHTML = `
    <div class="stats-column">
      ${renderColumn(leftStats)}
    </div>
    <div class="stats-column">
      ${renderColumn(rightStats)}
    </div>
  `;
  renderFactionAbilities();
}

/////////////////////////////////////
///// ABILITIES & RELIC POWERS /////
/////////////////////////////////////
function renderFactionAbilities() {
  const container = document.getElementById("abilityButtons");
  if (!container) return;
  container.innerHTML = "";
  if (!player?.faction) {
    const notice = document.createElement("p");
    notice.textContent = "Select a faction to unlock abilities.";
    container.appendChild(notice);
    return;
  }
  if (!player.faction.abilities?.length) {
    const notice = document.createElement("p");
    notice.textContent = "No special abilities unlocked.";
    container.appendChild(notice);
    return;
  }
  player.faction.abilities.forEach(ability => {
    const energyCost = ability?.cost?.energy ?? 0;
    const goldCost = ability?.cost?.gold ?? 0;
    const btn = document.createElement("button");
    btn.title = ability.desc;
    btn.disabled = player.energy < energyCost || player.gold < goldCost;

    const label = document.createElement("span");
    label.textContent = ability.name;
    const cost = document.createElement("small");
    const costParts = [];
    costParts.push(`⚡ ${energyCost}`);
    costParts.push(`💰 ${goldCost}`);
    cost.textContent = costParts.join(" • ");

    btn.appendChild(label);
    btn.appendChild(cost);
    btn.addEventListener("click", () => executeFactionAbility(ability));
    container.appendChild(btn);
  });
}

function executeFactionAbility(ability) {
  const energyCost = ability?.cost?.energy ?? 0;
  const goldCost = ability?.cost?.gold ?? 0;
  const message = ability?.activationMessage || `${ability.name} activated!`;
  spendEnergyAndGold(energyCost, goldCost, message, () => {
    if (typeof ability.logic === "function") {
      ability.logic({
        player,
        logEvent,
        updateDerivedStats,
        acquireRelic: acquireRandomRelic,
        acquireRelicFromFaction,
      });
    } else {
      logEvent(`${ability.name} crackles, but no power responds.`);
    }
    updateDerivedStats();
    renderHUD();
  });
}

function showRelicMenu() {
  const ownedRelics = (player.relics || []).filter(name => name && name !== "None");
  if (!ownedRelics.length) {
    logEvent("No relics to activate.");
    return;
  }
  const choice = prompt(
    `Choose a relic to activate (cost varies per relic):\n${ownedRelics
      .map((name, i) => {
        const relic = relicCatalog.get(name);
        const energyCost = relic?.energyCost ?? 1;
        return `${i + 1}. ${name} — ⚡${energyCost}`;
      })
      .join("\n")}`
  );
  if (!choice) {
    logEvent("Relic activation cancelled.");
    return;
  }
  const index = parseInt(choice, 10) - 1;
  const relicName = ownedRelics[index];
  if (!relicName) {
    logEvent("❌ Invalid relic choice.");
    return;
  }
  const relic = relicCatalog.get(relicName);
  if (!relic) {
    logEvent(`${relicName} has no defined power yet.`);
    return;
  }
  if (!(player.relicsUsedThisTurn instanceof Set)) {
    player.relicsUsedThisTurn = new Set();
  }
  if (player.relicsUsedThisTurn.has(relicName)) {
    logEvent(`${relicName} has already been invoked this turn.`);
    return;
  }
  const energyCost = relic.energyCost ?? 1;
  if (player.energy < energyCost) {
    logEvent("❌ Not enough energy to awaken that relic.");
    return;
  }
  player.energy -= energyCost;
  player.relicsUsedThisTurn.add(relicName);
  if (typeof relic.logic === "function") {
    relic.logic({
      player,
      logEvent,
    });
    updateDerivedStats();
    renderHUD();
  } else {
    logEvent(`${relicName} glows faintly, but nothing happens.`);
  }
}

function grantRelicToPlayer(relicName, sourceFactionName) {
  if (!relicName) return false;
  if (!player.relics) player.relics = [];
  if (!player.relics.includes(relicName)) {
    player.relics.push(relicName);
  }
  logEvent(`🔮 Acquired ${relicName} from ${sourceFactionName || "mysterious origins"}!`);
  return true;
}

function acquireRelicFromFaction(faction, reason = "battle") {
  if (!faction) return null;
  const relicName = factionRelics.get(faction.name);
  if (!relicName) return null;
  factionRelics.set(faction.name, null);
  grantRelicToPlayer(relicName, `${faction.name} (${reason})`);
  return relicName;
}

function acquireRandomRelic(options = {}) {
  const { reason = "delve", preferredFactions } = options;
  let pool = [...factionRelics.entries()].filter(([, relic]) => Boolean(relic));
  if (preferredFactions?.length) {
    const preferred = pool.filter(([owner]) => preferredFactions.includes(owner));
    if (preferred.length) pool = preferred;
  }
  if (!pool.length) return null;
  const [ownerName, relicName] = pool[Math.floor(Math.random() * pool.length)];
  factionRelics.set(ownerName, null);
  grantRelicToPlayer(relicName, `${ownerName} (${reason})`);
  return relicName;
}

function attemptRelicCapture(targetFaction) {
  if (!targetFaction) return false;
  const relicName = factionRelics.get(targetFaction.name);
  if (!relicName) {
    logEvent(`${targetFaction.name} has no relic left to seize.`);
    return false;
  }
  if (Math.random() > 0.33) {
    logEvent(`${targetFaction.name} protects ${relicName} this time.`);
    return false;
  }
  acquireRelicFromFaction(targetFaction, "battle victory");
  return true;
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

const peacePersonalities = {
  "The Crimson Horde": "hostile",
  "The Devoured Faith": "zealous",
  "The Jade Empire": "pragmatic",
  "The Meadowfolk Union": "peaceful",
  "The Silken Dominion": "schemer",
  "The Mycelial Monarchy": "patient",
};

function willFactionAcceptPeace(faction) {
  const attitude = peacePersonalities[faction.name] || "neutral";
  switch (attitude) {
    case "hostile":
      return false;
    case "peaceful":
      return true;
    case "pragmatic":
      return Math.random() > 0.25;
    case "schemer":
      return Math.random() > 0.55;
    case "zealous":
      return Math.random() > 0.65;
    case "patient":
      return Math.random() > 0.4;
    default:
      return Math.random() > 0.5;
  }
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
    const relationClass = isAlly ? "status-ally" : atWar ? "status-war" : "status-neutral";
    card.className = `diplomacy-faction ${relationClass}`;
    const header = document.createElement("div");
    header.innerHTML = `<strong class="${relationClass}">${faction.emoji} ${faction.name}</strong> — <span class="${relationClass}">${relation}</span>`;
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
    2,
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
  spendEnergyAndGold(
    2,
    0,
    `Opened peace talks with ${faction.name}.`,
    () => {
      const accepted = willFactionAcceptPeace(faction);
      if (accepted) {
        player.declaredWars = player.declaredWars.filter(name => name !== faction.name);
        logEvent(`🕊️ ${faction.name} accepted your peace offer. The war is over.`);
      } else {
        logEvent(`${faction.name} rejected your peace proposal. The war continues.`);
      }
    }
  );
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
          const captured = attemptRelicCapture(targetFaction);
          if (!captured) {
            grantBattleSpoils(targetFaction, atWar);
          }
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
      showRelicMenu();
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
      if (selected.tradeIncome) {
        player.tradePostIncome = (player.tradePostIncome || 0) + selected.tradeIncome;
        logEvent(`📦 Trading Posts now yield +${selected.tradeIncome} gold per turn.`);
      }
      if (selected.economyBonus) {
        player.economyBonus = (player.economyBonus || 0) + selected.economyBonus;
        logEvent("💹 Your economy strengthens thanks to the new trade hub.");
      }
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
function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  entry.classList.add("log-entry");
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
function endTurn() {
  const restored = calcStartingEnergy(player);
  player.energy += restored;
  logEvent(`🌙 Turn ended. Recovered ${restored} energy (total ${player.energy}).`);
  if (player.tradePostIncome) {
    player.gold += player.tradePostIncome;
    logEvent(`📦 Trading Posts delivered ${player.tradePostIncome} gold.`);
  }
  if (player.relicsUsedThisTurn?.clear) {
    player.relicsUsedThisTurn.clear();
  } else {
    player.relicsUsedThisTurn = new Set();
  }
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
  relicsUsedThisTurn: new Set(),
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
  factionRelics.set(faction.name, null);
}
