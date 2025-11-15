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

const harvestableGoods = [
  { key: "wheat", name: "Amber Wheat", emoji: "🌾", value: 18 },
  { key: "herbs", name: "Grove Herbs", emoji: "🌿", value: 20 },
  { key: "timber", name: "Lumber Bundles", emoji: "🪵", value: 24 },
  { key: "supplies", name: "Packed Supplies", emoji: "🎒", value: 22 },
];
const harvestGoodsMap = new Map(harvestableGoods.map(g => [g.key, g]));
const HARVEST_ENERGY_COST = 1;
const RELIC_DELVE_COST = { energy: 5, gold: 250 };
const ALLIANCE_COST = { energy: 1, gold: 30 };
const DECLARE_WAR_COST = { energy: 2, gold: 50 };
const PEACE_COST_ENERGY = 2;


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
    { label: "⚔️ Prowess Rank", value: player.prowess, pillar: true },
    { label: "🧱 Resilience Tier", value: player.resilience, pillar: true },
    { label: "📊 Economy Surge", value: player.economy, pillar: true },
  ];
  const renderColumn = stats =>
    stats
      .map(
        stat => `
        <div class="stat-item${stat.pillar ? " pillar-stat" : ""}">
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
  updateActionIndicators();
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
    btn.classList.add("action-ability-button");
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
  if (!ability) return;
  if (!(player.abilitiesUsedThisTurn instanceof Map)) {
    player.abilitiesUsedThisTurn = new Map();
  }
  const abilityKey = ability.id || ability.name;
  const usesSoFar = player.abilitiesUsedThisTurn.get(abilityKey) || 0;
  const maxUses = ability.usesPerTurn ?? 1;
  if (usesSoFar >= maxUses) {
    logEvent(`♻️ ${ability.name} cannot be invoked again this turn.`);
    return;
  }
  const energyCost = ability?.cost?.energy ?? 0;
  const goldCost = ability?.cost?.gold ?? 0;
  spendEnergyAndGold(energyCost, goldCost, null, () => {
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
    player.abilitiesUsedThisTurn.set(abilityKey, usesSoFar + 1);
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
  openActionModal("🔮 Relic Vault", body => {
    const grid = document.createElement("div");
    grid.className = "relic-grid";
    ownedRelics.forEach(name => {
      const relic = relicCatalog.get(name);
      if (!relic) return;
      const energyCost = relic.energyCost ?? 1;
      const used = player.relicsUsedThisTurn instanceof Set && player.relicsUsedThisTurn.has(name);
      const canAfford = player.energy >= energyCost;
      const statusText = used ? "Resting" : canAfford ? "Ready to awaken" : "Need more energy";
      const card = document.createElement("button");
      card.className = "relic-card";
      if (used) card.classList.add("spent");
      if (!canAfford) card.classList.add("locked");
      card.disabled = used || !canAfford;
      card.innerHTML = `
        <strong>${name}</strong>
        <p>${relic.effect || relic.type || "No effect listed."}</p>
        <div class="relic-meta">
          <span>${relic.type || "Relic"}</span>
          <span>⚡ ${energyCost}</span>
        </div>
        <div class="card-status">${statusText}</div>
      `;
      if (!card.disabled) {
        card.addEventListener("click", () => {
          closeActionModal();
          activateRelicPower(name);
        });
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function activateRelicPower(relicName) {
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
    logEvent("⚡ Not enough energy to awaken that relic.");
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
///  TARGETING & SPOILS HELPERS   ///
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
let actionModal = null;
let actionModalTitle = null;
let actionModalBody = null;
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
    allianceBtn.innerHTML = isAlly
      ? "Break Alliance"
      : `Offer Alliance <span class="cost-pill">⚡${ALLIANCE_COST.energy} • 💰${ALLIANCE_COST.gold}</span>`;
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
      warBtn.innerHTML = `Offer Peace <span class="cost-pill">⚡${PEACE_COST_ENERGY}</span>`;
      warBtn.addEventListener("click", () => {
        offerPeace(faction);
        renderDiplomacyMenu();
      });
    } else {
      warBtn.innerHTML = `Declare War <span class="cost-pill">⚡${DECLARE_WAR_COST.energy} • 💰${DECLARE_WAR_COST.gold}</span>`;
      warBtn.disabled = isAlly;
      warBtn.title = isAlly ? "Break the alliance first." : "";
      warBtn.addEventListener("click", () => {
        startWarWithFaction(faction);
        renderDiplomacyMenu();
      });
    }

    const loreBtn = document.createElement("button");
    loreBtn.textContent = "📜 Lore";

    const loreBlock = document.createElement("div");
    loreBlock.className = "faction-lore";
    loreBlock.textContent = faction.fullLore || "No lore recorded yet.";
    loreBlock.hidden = true;

    loreBtn.addEventListener("click", () => {
      const isHidden = loreBlock.hasAttribute("hidden");
      if (isHidden) {
        loreBlock.removeAttribute("hidden");
      } else {
        loreBlock.setAttribute("hidden", "hidden");
      }
    });

    actions.appendChild(allianceBtn);
    actions.appendChild(warBtn);
    actions.appendChild(loreBtn);
    card.appendChild(actions);
    card.appendChild(loreBlock);
    diplomacyList.appendChild(card);
  });
}

/////////////////////////////////////
///        ACTION MODAL UI        ///
/////////////////////////////////////
function openActionModal(title, builder) {
  if (!actionModal || !actionModalBody) return;
  actionModal.classList.add("open");
  if (actionModalTitle) {
    actionModalTitle.textContent = title;
  }
  actionModalBody.innerHTML = "";
  if (typeof builder === "function") {
    builder(actionModalBody);
  }
}

function closeActionModal() {
  if (actionModal) {
    actionModal.classList.remove("open");
  }
  if (actionModalBody) {
    actionModalBody.innerHTML = "";
  }
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
  spendEnergyAndGold(
    ALLIANCE_COST.energy,
    ALLIANCE_COST.gold,
    `🤝 Petitioned ${faction.name} for alliance.`,
    () => {
      const accepted = Math.random() > 0.35;
      if (accepted) {
        player.alliances.push(faction.name);
        logEvent(`🤝 ${faction.name} accepted your alliance offer!`);
      } else {
        logEvent(`${faction.name} declined your request for alliance.`);
      }
    }
  );
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
    DECLARE_WAR_COST.energy,
    DECLARE_WAR_COST.gold,
    `⚔️ Declared war on ${faction.name}! Troops rally to your banner.`,
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
    PEACE_COST_ENERGY,
    0,
    `🕊️ Opened peace talks with ${faction.name}.`,
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
      if (player.troops <= 0) {
        logEvent("🪖 Your armies are too depleted to battle.");
        break;
      }
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
      const projectedLoss = Math.max(3, Math.floor(player.troops * 0.15));
      const troopLoss = Math.min(player.troops, projectedLoss);
      spendEnergyAndGold(
        3,
        0,
        `⚔️ Clashed with ${targetFaction.name}. Lost ${troopLoss} troops but gained grit.`,
        () => {
          player.troops = Math.max(0, player.troops - troopLoss);
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
    case "harvest":
      harvestCrops();
      break;
    case "trade":
      performTrade();
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
          `📥 Collected imported ${importItem.name}! Gained ${importItem.price} gold${bonusMsg}!`,
          () => (player.gold += importItem.price)
        );
      } else {
        logEvent("📭 No imports to collect!");
      }
      break;
    case "delve":
      attemptRelicDelve();
      break;
    case "use-relic":
      showRelicMenu();
      break;
    case "inventory":
      showInventoryPanel();
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
function harvestCrops() {
  const limit = player.harvestLimit || 5;
  if (player.harvestsLeft <= 0) {
    logEvent("🌱 The fields need rest. Wait until next turn to harvest again.");
    return;
  }
  spendEnergyAndGold(HARVEST_ENERGY_COST, 0, null, () => {
    const bounty = harvestableGoods[Math.floor(Math.random() * harvestableGoods.length)];
    player.harvestedGoods[bounty.key] = (player.harvestedGoods[bounty.key] || 0) + 1;
    player.harvestsLeft = Math.max(0, player.harvestsLeft - 1);
    recalcHarvestedGoodsValue();
    logEvent(
      `${bounty.emoji} Harvested ${bounty.name}. (${player.harvestsLeft}/${limit} harvests left)`
    );
  });
}

function performTrade() {
  if (player.tradePosts <= 0) {
    logEvent("🏚️ You need a Trading Post before you can export goods.");
    return;
  }
  if (player.tradesRemaining <= 0) {
    logEvent("🚫 All trade missions have been used this turn.");
    return;
  }
  const goodsEntries = Object.entries(player.harvestedGoods || {}).filter(([, count]) => count > 0);
  if (!goodsEntries.length) {
    logEvent("🌾 No harvested goods ready for export.");
    return;
  }
  const choice = prompt(
    `Choose goods to export:\n${goodsEntries
      .map(([key, count], idx) => {
        const good = harvestGoodsMap.get(key);
        return `${idx + 1}. ${good?.emoji || "📦"} ${good?.name || key} — ${count} crate(s)`;
      })
      .join("\n")}`
  );
  if (!choice) {
    logEvent("Trade caravan was recalled.");
    return;
  }
  const index = parseInt(choice, 10) - 1;
  const [selectedKey] = goodsEntries[index] || [];
  if (!selectedKey) {
    logEvent("❌ Invalid goods selection.");
    return;
  }
  const good = harvestGoodsMap.get(selectedKey);
  if (!good) {
    logEvent("❌ Unknown goods cannot be traded.");
    return;
  }
  const economyMultiplier = Math.max(1, Math.pow(player.economy / 5 + 1, 1.05));
  const tradeStrength = 1 + player.tradePosts * 0.15;
  const goldEarned = Math.round(good.value * economyMultiplier * tradeStrength);
  spendEnergyAndGold(1, 0, `🚚 Exported ${good.emoji} ${good.name}.`, () => {
    player.harvestedGoods[selectedKey] = Math.max(
      0,
      (player.harvestedGoods[selectedKey] || 0) - 1
    );
    player.tradesRemaining = Math.max(0, player.tradesRemaining - 1);
    recalcHarvestedGoodsValue();
    player.gold += goldEarned;
    logEvent(
      `💹 Traders return with ${goldEarned} gold (Economy ×${economyMultiplier.toFixed(
        2
      )}, Posts ×${tradeStrength.toFixed(2)}).`
    );
  });
}

function attemptRelicDelve() {
  spendEnergyAndGold(
    RELIC_DELVE_COST.energy,
    RELIC_DELVE_COST.gold,
    "🕳️ Crews descend into forgotten ruins...",
    () => {
      const relic = acquireRandomRelic({ reason: "delve" });
      if (relic) {
        logEvent(`🔮 Unearthed ${relic} during the delve!`);
      } else {
        logEvent("🥀 The expedition returned empty-handed.");
      }
    }
  );
}

function showInventoryPanel() {
  openActionModal("📦 Inventory Ledger", body => {
    const info = document.createElement("div");
    info.className = "inventory-info";
    info.innerHTML = `
      <div>🚢 Imports waiting: <strong>${player.imports}</strong></div>
      <div>🌾 Harvests left: <strong>${player.harvestsLeft}/${player.harvestLimit || 5}</strong></div>
      <div>📦 Trades left: <strong>${player.tradesRemaining}/${player.tradePosts}</strong></div>
      <div>🛒 Trade Posts: <strong>${player.tradePosts}</strong></div>
    `;
    const goodsGrid = document.createElement("div");
    goodsGrid.className = "inventory-goods";
    harvestableGoods.forEach(g => {
      const item = document.createElement("div");
      item.className = "inventory-good";
      item.innerHTML = `<span>${g.emoji}</span>
        <div>
          <strong>${g.name}</strong>
          <small>${player.harvestedGoods[g.key] || 0} crate(s)</small>
        </div>`;
      goodsGrid.appendChild(item);
    });
    body.appendChild(info);
    body.appendChild(goodsGrid);
  });
}

function recalcHarvestedGoodsValue() {
  const total = Object.entries(player.harvestedGoods || {}).reduce((sum, [key, count]) => {
    const good = harvestGoodsMap.get(key);
    if (!good) return sum;
    return sum + good.value * count;
  }, 0);
  player.harvestedGoodsValue = total;
}

function getTotalHarvestedGoods() {
  return Object.values(player.harvestedGoods || {}).reduce((sum, count) => sum + count, 0);
}

function updateActionIndicators() {
  const buttons = document.querySelectorAll("#actionButtons button");
  buttons.forEach(btn => {
    const actionId = btn.dataset.action;
    const labelEl = btn.querySelector("span");
    const detailEl = btn.querySelector("small");
    if (detailEl && !detailEl.dataset.defaultText) {
      detailEl.dataset.defaultText = detailEl.textContent || "";
    }
    const resetLabel = () => {
      if (labelEl?.dataset.defaultText) {
        labelEl.textContent = labelEl.dataset.defaultText;
      }
    };
    switch (actionId) {
      case "harvest":
        if (labelEl) {
          labelEl.textContent = `🌾 Harvest (${player.harvestsLeft}/${player.harvestLimit || 5})`;
        }
        if (detailEl) {
          detailEl.textContent = "Gather crops and supplies.";
        }
        break;
      case "trade": {
        const totalCrates = getTotalHarvestedGoods();
        if (labelEl) {
          const totalPosts = player.tradePosts || 0;
          labelEl.textContent = `📦 Trade (${player.tradesRemaining}/${totalPosts})`;
        }
        if (detailEl) {
          detailEl.textContent = player.tradePosts
            ? `${totalCrates} crate(s) ready for export`
            : "Build a Trading Post to unlock trade.";
        }
        break;
      }
      case "collect":
        resetLabel();
        if (detailEl) {
          detailEl.textContent = player.imports
            ? `Imports waiting: ${player.imports}`
            : "No imports waiting.";
        }
        break;
      case "delve":
        resetLabel();
        if (detailEl) {
          detailEl.textContent = `Cost: ⚡${RELIC_DELVE_COST.energy} • 💰${RELIC_DELVE_COST.gold}`;
        }
        break;
      case "use-relic": {
        resetLabel();
        if (detailEl) {
          const ownedRelics = (player.relics || []).filter(name => name && name !== "None").length;
          detailEl.textContent = `Relics owned: ${ownedRelics}`;
        }
        break;
      }
      case "inventory":
        resetLabel();
        if (detailEl) {
          detailEl.textContent = "Review goods & logistics.";
        }
        break;
      default:
        resetLabel();
        if (detailEl?.dataset.defaultText) {
          detailEl.textContent = detailEl.dataset.defaultText;
        }
        break;
    }
  });
}

function buildMenu() {
  const available = buildings.filter(b => {
    const factionAllowed =
      b.availableTo === "all" ||
      (Array.isArray(b.availableTo) && b.availableTo.includes(player.faction.name));
    return factionAllowed;
  });

  if (!available.length) {
    logEvent("No buildings available right now.");
    return;
  }

  openActionModal("🏗️ Construct a Building", body => {
    const grid = document.createElement("div");
    grid.className = "build-grid";
    available.forEach(b => {
      const builtCount = player.buildings.filter(item => item === b.name).length;
      const prereqMet = !b.preRec || b.preRec === "none" || player.buildings.includes(b.preRec);
      const hasResources = player.gold >= b.cost.gold && player.energy >= b.cost.energy;
      const card = document.createElement("button");
      card.className = "build-card";
      if (!prereqMet) {
        card.classList.add("locked");
      } else if (!hasResources) {
        card.classList.add("costly");
      }
      card.disabled = !prereqMet || !hasResources;
      card.innerHTML = `
        <strong>${b.name}</strong>
        <p class="build-desc">${b.description}</p>
        <div class="build-meta">
          <span>💰 ${b.cost.gold}</span>
          <span>⚡ ${b.cost.energy}</span>
          <span>🏛️ ${builtCount}</span>
        </div>
        <div class="card-status">
          ${!prereqMet ? `Requires ${b.preRec}` : hasResources ? "Ready to build" : "Need more resources"}
        </div>
      `;
      if (prereqMet && hasResources) {
        card.addEventListener("click", () => {
          closeActionModal();
          purchaseBuilding(b);
        });
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function purchaseBuilding(selected) {
  spendEnergyAndGold(
    selected.cost.energy,
    selected.cost.gold,
    `🏗️ Built ${selected.name}!`,
    () => {
      player.buildings.push(selected.name);
      if (selected.statBoosts?.happiness) player.happiness += selected.statBoosts.happiness;
      if (selected.statBoosts?.protection) player.protection += selected.statBoosts.protection;
      if (selected.statBoosts?.gold) player.gold += selected.statBoosts.gold;
      if (selected.tradeIncome) {
        player.tradePostIncome = (player.tradePostIncome || 0) + selected.tradeIncome;
        logEvent(`📦 Trading Posts now yield +${selected.tradeIncome} gold per turn.`);
      }
      if (selected.economyBonus) {
        player.economyBonus = (player.economyBonus || 0) + selected.economyBonus;
        logEvent("💹 Your economy strengthens thanks to the new trade hub.");
      }
      if (selected.tradeBoost) {
        player.tradePosts = (player.tradePosts || 0) + 1;
        player.tradesRemaining = Math.min(
          player.tradePosts,
          (player.tradesRemaining || 0) + 1
        );
        logEvent(`🛒 Trade missions per turn increased to ${player.tradePosts}.`);
      }
      renderHUD();
    }
  );
}
function spendEnergyAndGold(energyCost, goldCost, msg, onSuccess) {
  if (player.energy < energyCost) {
    logEvent("⚡ Not enough energy!");
    return false;
  }
  if (player.gold < goldCost) {
    logEvent("💰 Not enough gold!");
    return false;
  }
  player.energy -= energyCost;
  player.gold -= goldCost;
  if (msg) {
    logEvent(msg);
  }
  if (onSuccess) {
    onSuccess();
  }
  return true;
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
  if (player.abilitiesUsedThisTurn?.clear) {
    player.abilitiesUsedThisTurn.clear();
  } else {
    player.abilitiesUsedThisTurn = new Map();
  }
  player.harvestsLeft = player.harvestLimit || 5;
  player.tradesRemaining = player.tradePosts;
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
  relics: [],
  buildings: [],
  declaredWars: [],
  alliances: [],
  tradePostIncome: 0,
  economyBonus: 0,
  relicsUsedThisTurn: new Set(),
  abilitiesUsedThisTurn: new Map(),
  harvestsLeft: 5,
  harvestLimit: 5,
  harvestedGoods: {},
  harvestedGoodsValue: 0,
  tradePosts: 0,
  tradesRemaining: 0,
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
  actionModal = document.getElementById("actionModal");
  actionModalTitle = document.getElementById("actionModalTitle");
  actionModalBody = document.getElementById("actionModalBody");
  const closeActionBtn = document.getElementById("closeActionModal");
  if (closeActionBtn) {
    closeActionBtn.addEventListener("click", closeActionModal);
  }
  if (actionModal) {
    actionModal.addEventListener("click", event => {
      if (event.target === actionModal) {
        closeActionModal();
      }
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
