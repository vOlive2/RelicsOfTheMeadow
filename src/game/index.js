/////////////////////////////////////
///        MODULE IMPORTS         ///
/////////////////////////////////////
import { factions } from "../../data/factions.js";
import { buildingDefinitions } from "../data/buildings.js";
import { resources as resourceDefinitions } from "../data/resources.js";
import { calculateResilience, calculateEconomy, calculateProwess, calcStartingEnergy } from "../utils/statCalc.js";
import { importItems } from "../../data/importItems.js";
import { battleSpoils } from "../../data/spoils.js";
import { relics as relicLibrary } from "../../data/relics.js";
import { startPlayerGame } from "./gameSetup.js";
import {
  initializeMapState as initializeWorldMap,
  getMapClearings,
  getFactionCapital,
  setFactionCapital,
  deleteFactionCapital,
  getClearingById,
  clearBeastFromClearing,
  exploreFromClearing,
  NEUTRAL_OWNER,
} from "../managers/mapManager.js";
import { constructBuilding } from "../managers/buildingManager.js";
import {
  hasBlueprint,
  getScaledCostForBlueprint,
  getStructuresInClearing,
  calculateProductionTotals,
  getProductionEntries,
  addResources as depositProducedResources,
} from "../managers/craftingManager.js";
import { hasResources, spendResources } from "../managers/resourceManager.js";
import {
  applyEventProductionModifiers,
  getActiveEvents,
  maybeTriggerRandomEvent,
  advanceEvents,
  resetEventState,
  startFestival,
} from "../managers/eventManager.js";
import { resolveBeastEncounter, resetCombatState } from "../managers/combatManager.js";
import { initMapUI, renderMap as renderWorldMap } from "../ui/mapUI.js";
import { renderResourcePanel } from "../ui/resourceUI.js";
import { renderPopulationPanel } from "../ui/populationUI.js";
console.log("✅ Game JS loaded!");

const relicCatalog = new Map(relicLibrary.map(relic => [relic.name, relic]));
const availableDelveRelics = new Set(relicLibrary.map(relic => relic.name));
const factionRelics = new Map();
const factionLookup = new Map();
factions.forEach(f => {
  factionRelics.set(f.name, f.startingRelic || null);
  factionLookup.set(f.name, f);
});

const harvestableGoods = [
  { key: "wheat", name: "Amber Wheat", emoji: "🌾", value: 18 },
  { key: "herbs", name: "Grove Herbs", emoji: "🌿", value: 20 },
  { key: "timber", name: "Lumber Bundles", emoji: "🪵", value: 24 },
  { key: "supplies", name: "Packed Supplies", emoji: "🎒", value: 22 },
  { key: "ore", name: "Shimmer Ore", emoji: "⛏️", value: 26 },
];
const factionHarvestGoods = {
  "The Crimson Horde": [{ key: "war_spoils", name: "War Spoils", emoji: "🩸", value: 32 }],
  "The Devoured Faith": [{ key: "relic_shard", name: "Relic Shard", emoji: "🕯️", value: 28 }],
  "The Jade Empire": [{ key: "trade_seal", name: "Trade Seal", emoji: "🐉", value: 30 }],
  "The Meadowfolk Union": [{ key: "sun_petals", name: "Sun Petals", emoji: "🌻", value: 24 }],
  "The Silken Dominion": [{ key: "silk_spool", name: "Silk Spool", emoji: "🧵", value: 27 }],
  "The Mycelial Monarchy": [{ key: "spore_bloom", name: "Spore Bloom", emoji: "🍄", value: 29 }],
};
const harvestGoodsMap = new Map();
function registerHarvestGoods(list) {
  list.forEach(good => {
    const existing = harvestGoodsMap.get(good.key) || {};
    const merged = {
      ...existing,
      ...good,
      weight: good.weight ?? existing.weight ?? 1,
    };
    harvestGoodsMap.set(good.key, merged);
  });
}
registerHarvestGoods(harvestableGoods);
Object.values(factionHarvestGoods).forEach(list => registerHarvestGoods(list));
const HARVEST_ENERGY_COST = 1;
const RELIC_DELVE_COST = { energy: 5, gold: 250 };
const RECRUIT_COST = { energy: 2, gold: 40 };
const COMMERCE_TRADE_COST = { energy: 1, gold: 0 };
const ALLIANCE_COST = { energy: 1, gold: 30 };
const DECLARE_WAR_COST = { energy: 2, gold: 50 };
const PEACE_COST_ENERGY = 2;
const EXPLORE_ENERGY_COST = 1;
const FESTIVAL_COST = { fruits: 12, wheat: 10 };
const aiStates = new Map();
const BASE_GOLD_STORAGE = 500;
let selectedClearingId = null;
const WORLD_EVENT_LIMIT = 6;
let worldEventFeed = [];
const structureEmojiMap = {
  Keep: "🏰",
  "Captured Holdfast": "🏴",
  "Hidden Capital": "🏯",
  "Basic House": "🏠",
  Villa: "🏡",
  Mansion: "🏘️",
  Manor: "🏛️",
  Townhouse: "🏠",
  Villa: "🏡",
  "Humble Mansion": "🏘️",
  Manor: "🏛️",
  Barracks: "🪖",
  "Farm Field": "🌾",
  Farm: "🌾",
  Orchard: "🍎",
  "Herb Garden": "🌿",
  "Garden of the Gods": "🌸",
  "Trading Post": "🏪",
  Vault: "🗄️",
  "Super Vault": "💎",
  Citadel: "⛪",
  "Mine Shaft": "⛏️",
  "Deep Mine Shaft": "⛏️",
  "Grand Mine": "⚒️",
  "Mine Hub": "⛏️",
  Statue: "🗽",
  Fountain: "⛲",
  Banners: "🚩",
  "Spinster's Hut": "🕸️",
  "Spinster's Mansion": "🕷️",
  "Web Outposts": "🕸️",
  "Web Stations": "🕸️",
  "Stronghold": "🛡️",
  "Base of Operations": "🏗️",
  "Spore Field": "🍄",
  Nest: "🐣",
  Hive: "🐝",
  "Mega Hive": "🧠",
};

function formatStructureName(name) {
  if (!name) return "";
  const emoji = structureEmojiMap[name] || "🏗️";
  return `${emoji} ${name}`;
}

function formatStructureList(structures = []) {
  if (!structures.length) return "—";
  const recent = structures.slice(-2).map(formatStructureName);
  const extra = structures.length - recent.length;
  return extra > 0 ? `${recent.join("<br>")} +${extra}` : recent.join("<br>");
}

const resourceLabelMap = Object.fromEntries(
  resourceDefinitions.map(resource => [resource.key, `${resource.icon} ${resource.name}`])
);

function formatResourceTotals(totals = {}) {
  const parts = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => `${amount} ${resourceLabelMap[key] || key}`);
  return parts.length ? parts.join(", ") : "no resources";
}

function announceWorldEvent(message) {
  worldEventFeed.push({ message, id: Date.now() + Math.random() });
  if (worldEventFeed.length > WORLD_EVENT_LIMIT) {
    worldEventFeed = worldEventFeed.slice(-WORLD_EVENT_LIMIT);
  }
  renderWorldEventFeed();
}

function renderWorldEventFeed() {
  const ticker = document.getElementById("eventTicker");
  if (!ticker) return;
  const active = getActiveEvents();
  const activeMarkup = active.length
    ? `<div class="event-active"><strong>Active Boons:</strong> ${active
        .map(event => `${event.name} (${event.turnsRemaining}t)`)
        .join(", ")}</div>`
    : `<div class="event-active muted">No active events.</div>`;
  const updates =
    worldEventFeed.length > 0
      ? worldEventFeed
          .slice(-WORLD_EVENT_LIMIT)
          .map(entry => `<div class="world-event">${entry.message}</div>`)
          .join("")
      : `<div class="world-event muted">No recent world events.</div>`;
  ticker.innerHTML = `${activeMarkup}${updates}`;
}

function getGoldStorageCapacity(target = player) {
  if (!target) return BASE_GOLD_STORAGE;
  const base = Number.isFinite(target.goldStorageBase) ? target.goldStorageBase : BASE_GOLD_STORAGE;
  const bonus = Number.isFinite(target.goldStorageBonus) ? target.goldStorageBonus : 0;
  return base + bonus;
}

function enforceGoldCapacity(target = player) {
  if (!target) return;
  const cap = getGoldStorageCapacity(target);
  if (target.gold > cap) {
    target.gold = cap;
  }
}

function grantGold(amount, target = player) {
  if (!target || !amount) return 0;
  const cap = getGoldStorageCapacity(target);
  const previous = Math.max(0, target.gold || 0);
  const next = Math.min(cap, previous + amount);
  target.gold = next;
  return next - previous;
}

function getActiveHarvestGoods() {
  const active = new Map();
  const addByKey = key => {
    const good = harvestGoodsMap.get(key);
    if (good) active.set(key, good);
  };
  harvestableGoods.forEach(g => addByKey(g.key));
  const factionExtras = player?.faction ? factionHarvestGoods[player.faction.name] : null;
  if (factionExtras) {
    factionExtras.forEach(g => addByKey(g.key));
  }
  if (player?.extraHarvestGoods?.length) {
    player.extraHarvestGoods.forEach(g => addByKey(g.key));
  }
  return [...active.values()];
}

function getHarvestCatalog() {
  const map = new Map();
  getActiveHarvestGoods().forEach(g => {
    if (!map.has(g.key)) {
      map.set(g.key, g);
    }
  });
  return [...map.values()];
}


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
  enforceGoldCapacity();
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
  const goldCap = getGoldStorageCapacity();
  const leftStats = [
    { label: "💖 Happiness", value: player.happiness },
    { label: "🛡️ Protection", value: player.protection },
    { label: "🪖 Troops", value: player.troops },
    { label: "💰 Gold", value: `${player.gold}/${goldCap}` },
    { label: "⚡ Energy", value: player.energy, extraClass: "stat-energy" },
  ];
  const rightStats = [
    { label: "⚔️ Prowess Rank", value: player.prowess, pillar: true },
    { label: "🧱 Resilience Rank", value: player.resilience, pillar: true },
    { label: "📊 Economy Rank", value: player.economy, pillar: true },
  ];
  const renderColumn = stats =>
    stats
      .map(
        stat => {
          const classes = ["stat-item"];
          if (stat.pillar) classes.push("pillar-stat");
          if (stat.extraClass) classes.push(stat.extraClass);
          return `
        <div class="${classes.join(" ")}">
          <strong>${stat.label}</strong>
          <span>${stat.value}</span>
        </div>`;
        }
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
  renderWorldMap({
    selectedClearingId,
    formatOwnerLabel,
    getOwnerColor,
    formatStructures: formatStructureList,
    formatTooltip: formatClearingTooltip,
  });
  renderResourcePanel();
  renderPopulationPanel();
  renderWorldEventFeed();
  renderMapActions();
}

/////////////////////////////////////
///        MAP & CLEARINGS        ///
/////////////////////////////////////
function getOwnerColor(ownerName) {
  if (ownerName === player?.faction?.name) return "#5ba571";
  if (ownerName === NEUTRAL_OWNER) return "#6b705c";
  return factionLookup.get(ownerName)?.palette?.[0] || "#6b705c";
}

function formatOwnerLabel(ownerName) {
  if (!ownerName) return "—";
  if (ownerName === player?.faction?.name) return `${player.faction.emoji} You`;
  if (ownerName === NEUTRAL_OWNER) return "🌲 Wilds";
  const faction = factionLookup.get(ownerName);
  return faction ? `${faction.emoji} ${faction.name}` : ownerName;
}

function getSelectedClearing() {
  if (!selectedClearingId) return null;
  return getClearingById(selectedClearingId);
}

function formatClearingTooltip(clearing) {
  if (!clearing) return "";
  const owner =
    clearing.owner === NEUTRAL_OWNER
      ? "Wilderness"
      : clearing.owner === player?.faction?.name
      ? "Your control"
      : clearing.owner || "None";
  const structures = Array.isArray(clearing.structures) && clearing.structures.length
    ? clearing.structures.join(", ")
    : "None";
  const beastLine = clearing.beast ? `<div>Beast: ${clearing.beast.type} (⚔️ ${clearing.beast.strength})</div>` : "";
  const rarityLine = clearing.rarity ? `<div>Rarity: ${clearing.rarity}</div>` : "";
  return `
    <div><strong>Clearing #${clearing.id}</strong></div>
    <div>Terrain: ${clearing.terrain}</div>
    <div>Owner: ${owner}</div>
    ${rarityLine}
    ${beastLine}
    <div>Structures: ${structures}</div>
  `;
}

function evaluateBlueprintAvailability(definition, clearing, structuresHere = null) {
  if (!definition || !clearing) return { canBuild: false, reason: "No clearing selected", cost: {} };
  if (!hasBlueprint(definition.key)) {
    return { canBuild: false, reason: "Blueprint locked", cost: getScaledCostForBlueprint(definition.key) };
  }
  if (definition.supportedTerrains && !definition.supportedTerrains.includes(clearing.terrain)) {
    return { canBuild: false, reason: "Wrong terrain", cost: getScaledCostForBlueprint(definition.key) };
  }
  const structures = structuresHere || getStructuresInClearing(clearing.id);
  if (definition.upgradeFrom && !structures.some(structure => structure.key === definition.upgradeFrom)) {
    const previous = buildingDefinitions.find(entry => entry.key === definition.upgradeFrom);
    return {
      canBuild: false,
      reason: `Requires ${previous?.name || "previous tier"} in this clearing`,
      cost: getScaledCostForBlueprint(definition.key),
    };
  }
  const scaledCost = getScaledCostForBlueprint(definition.key);
  if (!hasResources(scaledCost)) {
    return { canBuild: false, reason: "Need materials", cost: scaledCost };
  }
  return { canBuild: true, reason: "", cost: scaledCost };
}

function refreshHarvestAvailability() {
  const hasProduction = getProductionEntries().length > 0;
  if (!hasProduction) {
    player.harvestLimit = 0;
    player.harvestsLeft = 0;
    return;
  }
  if ((player.harvestLimit || 0) === 0) {
    player.harvestLimit = 1;
    player.harvestsLeft = 1;
    return;
  }
  player.harvestsLeft = Math.min(player.harvestsLeft || 0, player.harvestLimit || 0);
}

function renderMapActions() {
  const container = document.getElementById("mapActions");
  if (!container) return;
  const clearing = getSelectedClearing();
  if (!clearing) {
    container.innerHTML = "<p>Select a clearing to explore or engage.</p>";
    return;
  }
  container.innerHTML = "";
  const directions = [
    { id: "north", label: "Explore North" },
    { id: "east", label: "Explore East" },
    { id: "south", label: "Explore South" },
    { id: "west", label: "Explore West" },
  ];
  directions.forEach(dir => {
    const btn = document.createElement("button");
    btn.textContent = dir.label;
    btn.disabled = player.energy < EXPLORE_ENERGY_COST;
    btn.addEventListener("click", () => exploreSelectedDirection(dir.id));
    container.appendChild(btn);
  });
  if (clearing.beast) {
    const beastBtn = document.createElement("button");
    beastBtn.textContent = "Battle Beast";
    beastBtn.className = "danger";
    beastBtn.disabled = player.troops <= 0;
    beastBtn.addEventListener("click", () => battleBeastAtClearing(clearing));
    container.appendChild(beastBtn);
  }
}

function exploreSelectedDirection(direction) {
  const clearing = getSelectedClearing();
  if (!clearing) {
    logEvent("📍 Select a clearing to explore from.");
    return;
  }
  spendEnergyAndGold(EXPLORE_ENERGY_COST, 0, `🧭 Scouts push ${direction}.`, () => {
    const { clearing: result, discovered } = exploreFromClearing(clearing.id, direction);
    if (!result) {
      logEvent("🧭 The path leads nowhere interesting.");
      return;
    }
    selectedClearingId = result.id;
    const discoveryText = discovered
      ? `Discovered ${result.terrain}${result.rarity ? ` (${result.rarity})` : ""}.`
      : "Already mapped.";
    logEvent(`🗺️ Exploration ${direction}: ${discoveryText}`);
    if (discovered && result.beast) {
      handleBeastEncounter(result, true);
    }
    refreshHarvestAvailability();
    renderHUD();
  });
}

function battleBeastAtClearing(clearing) {
  if (!clearing) return;
  handleBeastEncounter(clearing, false);
}

function handleBeastEncounter(clearing, autoTriggered = false) {
  if (!clearing?.beast) {
    if (!autoTriggered) logEvent("✨ No beasts stalk that clearing.");
    return;
  }
  if (player.troops <= 0) {
    if (!autoTriggered) logEvent("🪖 No troops available to confront the beast.");
    return;
  }
  if (!autoTriggered) {
    logEvent(`⚔️ You engage the ${clearing.beast.type} at clearing #${clearing.id}.`);
  }
  const result = resolveBeastEncounter({
    player,
    clearing,
    beast: clearing.beast,
    announce: announceWorldEvent,
  });
  if (result.victory) {
    clearBeastFromClearing(clearing.id);
  }
  renderHUD();
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

  const triggerAbility = selectedFaction => {
    spendEnergyAndGold(energyCost, goldCost, null, () => {
      if (typeof ability.logic === "function") {
        ability.logic({
          player,
          logEvent,
          updateDerivedStats,
          acquireRelic: acquireRandomRelic,
          acquireRelicFromFaction,
          targetFaction: selectedFaction,
        });
      } else {
        logEvent(`${ability.name} crackles, but no power responds.`);
      }
      player.abilitiesUsedThisTurn.set(abilityKey, usesSoFar + 1);
      updateDerivedStats();
      renderHUD();
    });
  };

  if (abilityNeedsFactionTarget(ability)) {
    const candidates = factions.filter(f => f.name !== player.faction.name);
    showFactionSelectionModal({
      title: `Select a faction to ${ability.name.toLowerCase()}`,
      candidates,
      emptyMessage: "No factions available for that ability.",
      onSelect: target => triggerAbility(target),
    });
    return;
  }

  triggerAbility();
}

function abilityNeedsFactionTarget(ability) {
  return player.faction?.name === "The Crimson Horde" && ability.name === "Raid";
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

function markRelicClaimed(relicName) {
  if (!relicName || relicName === "None") return;
  availableDelveRelics.delete(relicName);
}

function grantRelicToPlayer(relicName, sourceFactionName) {
  if (!relicName) return false;
  if (!player.relics) player.relics = [];
  if (!player.relics.includes(relicName)) {
    player.relics.push(relicName);
  }
  markRelicClaimed(relicName);
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
  if (reason === "delve") {
    const pool = [...availableDelveRelics];
    if (!pool.length) return null;
    const relicName = pool[Math.floor(Math.random() * pool.length)];
    grantRelicToPlayer(relicName, `${reason}`);
    return relicName;
  }
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

function hasAvailableDelveRelics() {
  return availableDelveRelics.size > 0;
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

function attemptPlayerRelicTheft(attackerName, baseChance = 0.35) {
  if (attackerName !== "The Devoured Faith") return false;
  const owned = (player.relics || []).filter(name => name && name !== "None");
  if (!owned.length) {
    announceWorldEvent(`${attackerName} found no relics worth stealing.`);
    return false;
  }
  const shield = player.relicShield || 0;
  const successChance = Math.max(0.05, baseChance - shield * 0.05);
  if (Math.random() > successChance) {
    announceWorldEvent(`${attackerName} failed to breach your vaults.`);
    return false;
  }
  const index = Math.floor(Math.random() * owned.length);
  const relicName = owned[index];
  const removalIndex = player.relics.indexOf(relicName);
  if (removalIndex >= 0) {
    player.relics.splice(removalIndex, 1);
  }
  factionRelics.set(attackerName, relicName);
  announceWorldEvent(`🕵️ ${attackerName} stole ${relicName} from your vaults!`);
  return true;
}

const aiAggressionTendencies = {
  "The Crimson Horde": 0.7,
  "The Devoured Faith": 0.5,
  "The Jade Empire": 0.2,
  "The Meadowfolk Union": 0.15,
  "The Silken Dominion": 0.4,
  "The Mycelial Monarchy": 0.45,
};

const aiDiplomacyTendencies = {
  "The Crimson Horde": 0.2,
  "The Devoured Faith": 0.25,
  "The Jade Empire": 0.5,
  "The Meadowfolk Union": 0.6,
  "The Silken Dominion": 0.35,
  "The Mycelial Monarchy": 0.3,
};

const aiAbilityEffects = {
  Taxes: state => {
    const levy = Math.min(player.gold, 25 + player.economy);
    player.gold -= levy;
    state.gold = (state.gold || 0) + levy;
    announceWorldEvent(`🐉 ${state.faction.name} taxes your caravans for ${levy} gold.`);
  },
  Diplomats: state => {
    if (player.declaredWars.includes(state.faction.name)) {
      player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
      announceWorldEvent(`🐉 ${state.faction.name} enforces diplomatic peace and exits the war.`);
    } else {
      player.happiness += 1;
      announceWorldEvent(`🐉 ${state.faction.name}'s diplomats soothe tensions, boosting happiness.`);
    }
  },
  Loot: state => {
    const theft = Math.min(player.gold, 15 + Math.round((state.aggression || 0.3) * 30));
    player.gold -= theft;
    state.gold = (state.gold || 0) + theft;
    announceWorldEvent(`🐺 ${state.faction.name} loot ${theft} gold from your border towns.`);
  },
  Raid: () => {
    const loss = Math.min(player.troops, 5 + Math.round(player.protection / 2));
    player.troops = Math.max(0, player.troops - loss);
    player.happiness = Math.max(0, player.happiness - 1);
    announceWorldEvent(`🐺 Horde raiders cut down ${loss} of your troops and demoralize the people.`);
  },
  Consume: () => {
    const drain = Math.min(player.energy, 2);
    player.energy -= drain;
    announceWorldEvent(`🐺 Horde zealots burn your supply lines, draining ${drain} energy.`);
  },
  Delve: state => {
    if (!attemptPlayerRelicTheft(state.faction.name, 0.55)) {
      announceWorldEvent(`🕯️ ${state.faction.name} failed to recover a relic from you.`);
    }
  },
  Sanctify: () => {
    const tithe = Math.min(player.gold, 20);
    player.gold -= tithe;
    player.happiness = Math.max(0, player.happiness - 1);
    announceWorldEvent(`🕯️ The Devoured Faith sanctifies your markets, seizing ${tithe} gold.`);
  },
  Encamp: () => {
    player.protection = Math.max(0, player.protection - 1);
    announceWorldEvent("🕯️ Faith encampments unsettle your border, lowering protection.");
  },
  Infiltration: state => {
    if (!attemptPlayerRelicTheft(state.faction.name, 0.65)) {
      player.gold = Math.max(0, player.gold - 15);
      announceWorldEvent(`🕯️ ${state.faction.name} siphons 15 gold through infiltration.`);
    }
  },
  Harmony: () => {
    player.happiness += 1;
    player.protection += 1;
    announceWorldEvent("🌾 Meadowfolk harmony radiates outward, lifting spirits and defenses.");
  },
  Cooperation: () => {
    player.harvestedGoods = player.harvestedGoods || {};
    player.harvestedGoods.wheat = (player.harvestedGoods.wheat || 0) + 1;
    announceWorldEvent("🌾 Meadowfolk share a crate of wheat with you.");
    recalcHarvestedGoodsValue();
  },
  Regrow: () => {
    player.harvestsLeft = Math.min(player.harvestLimit, (player.harvestsLeft || 0) + 2);
    announceWorldEvent("🌾 Meadowfolk regrow your fields, restoring harvest chances.");
  },
  SpinWeb: () => {
    player.tradesRemaining = Math.max(0, (player.tradesRemaining || 0) - 1);
    announceWorldEvent("🕷️ Silken Dominion webs delay one of your trade missions.");
  },
  Manipulate: () => {
    player.happiness = Math.max(0, player.happiness - 1);
    announceWorldEvent("🕷️ Silken agents spread rumors, dinging happiness.");
  },
  Entangle: () => {
    const energySnare = Math.min(player.energy, 1);
    player.energy -= energySnare;
    announceWorldEvent("🕷️ Entangling strands sap a bit of your energy.");
  },
  Spread: () => {
    player.protection = Math.max(0, player.protection - 1);
    announceWorldEvent("🍄 Spores spread through your ramparts, weakening protection.");
  },
  Bloom: () => {
    player.happiness = Math.max(0, player.happiness - 1);
    announceWorldEvent("🍄 Mycelial blooms unsettle the populace, lowering happiness.");
  },
  Rebirth: () => {
    player.harvestedGoods = player.harvestedGoods || {};
    if (player.harvestedGoods.spore_bloom) {
      player.harvestedGoods.spore_bloom = Math.max(0, player.harvestedGoods.spore_bloom - 1);
    }
    player.energy = Math.max(0, player.energy - 1);
    announceWorldEvent("🍄 A spore rebirth consumes supplies, draining a little energy.");
    recalcHarvestedGoodsValue();
  },
};

function initializeAIStates(playerFaction) {
  aiStates.clear();
  factions.forEach(faction => {
    if (faction.name === playerFaction.name) return;
    aiStates.set(faction.name, createAIState(faction));
  });
  seedAIRivals();
}

function createAIState(faction) {
  const parse = value => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 3;
  };
  const troopBase = parse(faction.defaultTraits?.prowess) * 10 + 40;
  return {
    faction,
    gold: parse(faction.defaultTraits?.economy) * 20 + 100,
    troops: troopBase,
    troopBase,
    resilience: parse(faction.defaultTraits?.resilience) + 5,
    aggression: aiAggressionTendencies[faction.name] ?? 0.3,
    diplomacy: aiDiplomacyTendencies[faction.name] ?? 0.3,
    rivals: [],
    energy: 6,
    eliminated: false,
    returnTimer: 0,
  };
}

function seedAIRivals() {
  const names = [...aiStates.keys()];
  aiStates.forEach((state, name) => {
    const others = names.filter(other => other !== name);
    state.rivals = shuffleArray(others).slice(0, 2);
  });
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function processAIFactionTurns() {
  aiStates.forEach(state => executeAIFactionTurn(state));
}

function executeAIFactionTurn(state) {
  const factionName = state.faction.name;
  announceWorldEvent(`⋘ ${state.faction.emoji} ${factionName} makes their move ⋙`);
  if (state.eliminated) {
    state.returnTimer = Math.max(0, (state.returnTimer || 0) - 1);
    if (state.returnTimer <= 0) {
      respawnFaction(state);
    } else {
      announceWorldEvent(
        `${state.faction.emoji} ${factionName} regroups (${state.returnTimer} turns left).`
      );
    }
    return;
  }
  resolvePendingPeaceFor(state);
  state.energy = Math.min(12, (state.energy || 0) + 4);
  if (state.faction.name === "The Meadowfolk Union") {
    aiMeadowfolkTurn(state);
    return;
  }
  const maxActions = 3;
  let actions = 0;
  while (actions < maxActions && state.energy > 0) {
    const acted = performAIAction(state);
    if (!acted) break;
    actions += 1;
  }
}

function performAIAction(state) {
  if (player.declaredWars.includes(state.faction.name)) {
    aiWarSkirmish(state);
    state.energy = Math.max(0, (state.energy || 0) - 2);
    return true;
  }
  if (
    state.energy >= 1 &&
    !player.alliances.includes(state.faction.name) &&
    Math.random() < state.diplomacy * 0.4
  ) {
    aiRequestAlliance(state);
    state.energy = Math.max(0, (state.energy || 0) - 1);
    return true;
  }
  if (state.energy >= 2 && Math.random() < state.aggression * 0.4) {
    aiDeclareWarOnPlayer(state);
    state.energy = Math.max(0, (state.energy || 0) - 2);
    return true;
  }
  const abilities = state.faction.abilities || [];
  if (abilities.length && state.energy >= 2 && Math.random() < 0.55) {
    aiUseAbility(state);
    state.energy = Math.max(0, (state.energy || 0) - 2);
    return true;
  }
  if (state.rivals?.length && state.energy >= 2 && Math.random() < 0.4) {
    aiAttackRival(state);
    state.energy = Math.max(0, (state.energy || 0) - 2);
    return true;
  }
  aiGatherResources(state);
  state.energy = Math.max(0, (state.energy || 0) - 1);
  return true;
}

function resolvePendingPeaceFor(state) {
  if (!Array.isArray(player.pendingPeaceOffers)) return;
  const offer = player.pendingPeaceOffers.find(entry => entry.faction === state.faction.name);
  if (!offer) return;
  offer.turnsRemaining -= 1;
  if (offer.turnsRemaining > 0) return;
  const accepted = willFactionAcceptPeace(state.faction);
  if (accepted) {
    player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
    announceWorldEvent(`🕊️ ${state.faction.name} accepts your peace proposal.`);
  } else {
    announceWorldEvent(`${state.faction.name} rejects your peace envoy.`);
  }
  player.pendingPeaceOffers = player.pendingPeaceOffers.filter(entry => entry !== offer);
}

function aiWarSkirmish(state) {
  const name = state.faction.name;
  switch (name) {
    case "The Crimson Horde": {
      const loss = Math.max(1, Math.round((state.troops || 30) / 12));
      player.troops = Math.max(0, player.troops - loss);
      const plunder = Math.min(player.gold, 10 + loss * 2);
      player.gold -= plunder;
      state.gold = (state.gold || 0) + plunder;
      announceWorldEvent(
        `${state.faction.emoji} ${name} raids your lands, costing ${loss} troops and ${plunder} gold.`
      );
      break;
    }
    case "The Devoured Faith":
      player.happiness = Math.max(0, player.happiness - 1);
      player.protection = Math.max(0, player.protection - 1);
      attemptPlayerRelicTheft(name, 0.45);
      announceWorldEvent(`${state.faction.emoji} ${name} spreads dread through your people.`);
      break;
    case "The Jade Empire":
      if (player.gold > 0) {
        const tithe = Math.min(player.gold, 25);
        player.gold -= tithe;
        state.gold = (state.gold || 0) + tithe;
        announceWorldEvent(`🐉 ${name} levies a trade tithe, seizing ${tithe} gold.`);
      }
      break;
    default:
      player.protection = Math.max(0, player.protection - 1);
      announceWorldEvent(`${state.faction.emoji} ${name} presses the war, wearing down your defenses.`);
      break;
  }
  if (Math.random() < 0.2) {
    queuePlayerPrompt({
      type: "peace",
      faction: name,
      title: "Peace Negotiation",
      message: `${state.faction.emoji} ${name} offers to end the war. Accept peace?`,
      acceptLabel: "Accept Peace",
      declineLabel: "Reject",
      onAccept: () => {
        player.declaredWars = player.declaredWars.filter(enemy => enemy !== name);
        logEvent(`🕊️ ${name} agrees to a ceasefire.`);
      },
      onDecline: () => {
        logEvent(`${name} vows to continue the fight.`);
      },
    });
  }
}

function aiRequestAlliance(state) {
  if (player.declaredWars.includes(state.faction.name)) return;
  announceWorldEvent(`${state.faction.emoji} ${state.faction.name} requests an alliance.`);
  queuePlayerPrompt({
    type: "alliance",
    faction: state.faction.name,
    title: "Alliance Proposal",
    message: `${state.faction.emoji} ${state.faction.name} extends an alliance. Do you accept?`,
    acceptLabel: "Accept Alliance",
    declineLabel: "Decline",
    onAccept: () => {
      if (!player.alliances.includes(state.faction.name)) {
        player.alliances.push(state.faction.name);
      }
      player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
      logEvent(`🤝 You accept the alliance with ${state.faction.name}.`);
    },
    onDecline: () => {
      logEvent(`❌ You decline ${state.faction.name}'s offer, keeping them at arm's length.`);
    },
  });
}

function aiDeclareWarOnPlayer(state) {
  if (player.declaredWars.includes(state.faction.name)) return;
  player.alliances = player.alliances.filter(name => name !== state.faction.name);
  player.declaredWars.push(state.faction.name);
  announceWorldEvent(`⚔️ ${state.faction.name} declares war on you!`);
}

function aiMeadowfolkTurn(state) {
  if (player.declaredWars.includes(state.faction.name)) {
    queuePlayerPrompt({
      type: "peace",
      faction: state.faction.name,
      title: "Peace Offering",
      message: `${state.faction.emoji} ${state.faction.name} pleads for peace. Accept the truce?`,
      acceptLabel: "Accept Peace",
      declineLabel: "Continue War",
      onAccept: () => {
        player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
        logEvent(`🕊️ Peace restored with ${state.faction.name}.`);
      },
      onDecline: () => logEvent(`${state.faction.name} sadly withdraws their peace envoy.`),
    });
    return;
  }
  if (!player.alliances.includes(state.faction.name)) {
    aiRequestAlliance(state);
    return;
  }
  player.happiness += 1;
  player.resilience += 1;
  announceWorldEvent("🌾 Meadowfolk gifts bolster your morale and resilience.");
  state.energy = Math.max(0, (state.energy || 0) - 1);
}

function aiUseAbility(state) {
  const abilities = state.faction.abilities || [];
  if (!abilities.length) {
    aiGatherResources(state);
    return;
  }
  const ability = abilities[Math.floor(Math.random() * abilities.length)];
  applyAIAbilityEffect(state, ability);
}

function applyAIAbilityEffect(state, ability) {
  const fn = aiAbilityEffects[ability.name];
  if (fn) {
    fn(state);
  } else {
    announceWorldEvent(
      `${state.faction.emoji} ${state.faction.name} practices ${ability.name}, plotting silently.`
    );
  }
}

function aiGatherResources(state) {
  const haul = 10 + Math.floor(Math.random() * 10);
  state.gold = (state.gold || 0) + haul;
  state.troops = (state.troops || 0) + 2;
  announceWorldEvent(
    `${state.faction.emoji} ${state.faction.name} consolidates, earning ${haul} gold.`
  );
}

function aiAttackRival(state) {
  if (!state.rivals || !state.rivals.length) return;
  const opponentName = state.rivals[Math.floor(Math.random() * state.rivals.length)];
  const opponentState = aiStates.get(opponentName);
  if (!opponentState) return;
  const swing = Math.max(2, Math.round((state.troops || 20) / 15));
  opponentState.troops = Math.max(0, (opponentState.troops || 0) - swing);
  state.troops = Math.max(0, (state.troops || 0) - Math.floor(swing / 2));
  announceWorldEvent(
    `${state.faction.emoji} ${state.faction.name} clashes with ${opponentState.faction.emoji} ${opponentState.faction.name} away from your borders.`
  );
}

/////////////////////////////////////
///  TARGETING & SPOILS HELPERS   ///
/////////////////////////////////////
function grantBattleSpoils(targetFaction, atWar) {
  if (!battleSpoils || !battleSpoils.length) return;
  const spoils = battleSpoils[Math.floor(Math.random() * battleSpoils.length)];
  const multiplier = atWar ? 2 : 1;
  const gains = [];
  const goldGain = (spoils.price || 0) * multiplier;
  if (goldGain) {
    const addedGold = grantGold(goldGain);
    if (addedGold > 0) {
      gains.push(`${addedGold} gold`);
    }
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

function applyBattleDamageToFaction(targetFaction, atWar) {
  const state = aiStates.get(targetFaction.name);
  if (!state) return;
  const prowess = Math.max(3, Math.floor(player.prowess || 0));
  const bonus = (player.battleBonus || 0) + (atWar ? 5 : 2);
  const damage = prowess + bonus;
  state.troops = Math.max(0, (state.troops || 0) - damage);
  logEvent(
    `${targetFaction.emoji || ""} ${targetFaction.name} loses ${damage} warriors (${state.troops} remain).`
  );
  if (state.troops <= 0 && !state.eliminated) {
    eliminateFactionFromMap(state);
  }
}

function eliminateFactionFromMap(state) {
  state.eliminated = true;
  state.returnTimer = 3;
  const factionName = state.faction.name;
  const captured = [];
  getMapClearings().forEach(clearing => {
    if (clearing.owner === factionName) {
      clearing.owner = player.faction.name;
      clearing.capitalOf = null;
      clearing.structures = ["Captured Holdfast"];
      captured.push(clearing.id);
    }
  });
  deleteFactionCapital(factionName);
  renderWorldMap({
    selectedClearingId,
    formatOwnerLabel,
    getOwnerColor,
    formatStructures: formatStructureList,
  });
  logEvent(
    `🏰 ${state.faction.emoji} ${factionName}'s capital falls! Their holdings become yours for now.`
  );
}

function respawnFaction(state) {
  const factionName = state.faction.name;
  const playerCapitalId = getFactionCapital(player.faction.name);
  const playerTerritories = getMapClearings().filter(
    clearing => clearing.owner === player.faction.name && clearing.id !== playerCapitalId
  );
  let target =
    playerTerritories.length > 0
      ? playerTerritories[Math.floor(Math.random() * playerTerritories.length)]
      : getMapClearings().find(clearing => clearing.owner === NEUTRAL_OWNER);
  if (!target) {
    announceWorldEvent(`${factionName} seeks a new foothold but finds none this year.`);
    state.returnTimer = 1;
    return;
  }
  target.owner = factionName;
  target.capitalOf = factionName;
  target.structures = ["Hidden Capital"];
  setFactionCapital(factionName, target.id);
  state.eliminated = false;
  state.returnTimer = 0;
  state.troops = Math.max(40, state.troopBase || 60);
  announceWorldEvent(`${state.faction.emoji} ${factionName} resurfaces in clearing #${target.id}!`);
  renderWorldMap({
    selectedClearingId,
    formatOwnerLabel,
    getOwnerColor,
    formatStructures: formatStructureList,
  });
}

function getBattleTargets() {
  return factions.filter(f => {
    if (f.name === player.faction.name) return false;
    if (player.alliances.includes(f.name)) return false;
    const state = aiStates.get(f.name);
    if (state?.eliminated) return false;
    return true;
  });
}

function showBattleModal() {
  if (player.troops <= 0) {
    logEvent("🪖 Your armies are too depleted to battle.");
    return;
  }
  if (player.energy < 3) {
    logEvent("⚡ Not enough energy to battle.");
    return;
  }
  const availableTargets = getBattleTargets();
  if (!availableTargets.length) {
    logEvent("All factions are presently allied with you. Break an alliance before battling.");
    return;
  }
  openActionModal("⚔️ Choose a target", body => {
    const grid = document.createElement("div");
    grid.className = "build-grid battle-grid";
    availableTargets.forEach(target => {
      const isWar = player.declaredWars.includes(target.name);
      const relation = isWar ? "At War" : "Neutral";
      const card = document.createElement("button");
      card.className = `build-card battle-card ${isWar ? "status-war" : ""}`;
      card.disabled = player.energy < 3;
      card.innerHTML = `
        <strong>${target.emoji} ${target.name}</strong>
        <p class="battle-summary">${target.overview || "Their intentions are unknown."}</p>
        <div class="battle-meta">
          <span>${relation}</span>
          <span>Focus: ${target.defaultTraits?.prowess ?? "?"}</span>
        </div>
      `;
      card.addEventListener("click", () => {
        closeActionModal();
        executeBattle(target);
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function executeBattle(targetFaction) {
  const atWar = player.declaredWars.includes(targetFaction.name);
  const projectedLoss = Math.max(3, Math.floor(player.troops * 0.15));
  const troopLoss = Math.min(player.troops, projectedLoss);
  spendEnergyAndGold(
    3,
    0,
    `⚔️ Clashed with ${targetFaction.name}. Lost ${troopLoss} troops but gained grit.`,
    () => {
      const mitigation = player.battleBonus || 0;
      player.troops = Math.max(0, player.troops - Math.max(0, troopLoss - mitigation));
      player.protection = Math.max(0, player.protection + 1);
      player.happiness = Math.max(0, player.happiness - 1);
      const captured = attemptRelicCapture(targetFaction);
      if (!captured) {
        grantBattleSpoils(targetFaction, atWar);
      }
      applyBattleDamageToFaction(targetFaction, atWar);
    }
  );
}

function showFactionSelectionModal({ title, candidates, emptyMessage, onSelect }) {
  if (!candidates?.length) {
    logEvent(emptyMessage || "No factions available for that action.");
    return;
  }
  openActionModal(title, body => {
    const grid = document.createElement("div");
    grid.className = "build-grid faction-grid";
    candidates.forEach(f => {
      const card = document.createElement("button");
      const isWar = player.declaredWars.includes(f.name);
      card.className = `build-card ${isWar ? "status-war" : ""}`;
      card.innerHTML = `
        <strong>${f.emoji} ${f.name}</strong>
        <p class="battle-summary">${f.overview || ""}</p>
      `;
      card.addEventListener("click", () => {
        closeActionModal();
        onSelect?.(f);
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
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
  const alreadyPending = player.pendingPeaceOffers?.some(entry => entry.faction === faction.name);
  if (alreadyPending) {
    logEvent(`🕊️ A peace envoy is already en route to ${faction.name}.`);
    return;
  }
  spendEnergyAndGold(PEACE_COST_ENERGY, 0, `🕊️ Opened peace talks with ${faction.name}.`, () => {
    if (!Array.isArray(player.pendingPeaceOffers)) player.pendingPeaceOffers = [];
    player.pendingPeaceOffers.push({ faction: faction.name, turnsRemaining: 1 });
    logEvent(`📜 Await ${faction.name}'s response next round.`);
  });
}

/////////////////////////////////////
///         ACTION ROUTER         ///
/////////////////////////////////////
function handleAction(action) {
  switch (action) {
    case "diplomacy":
      showDiplomacyMenu();
      break;
    case "battle":
      showBattleModal();
      break;
    case "build":
      buildMenu();
      break;
    case "harvest":
      harvestCrops();
      break;
    case "commerce":
      showCommerceModal();
      break;
    case "festival":
      startFestivalAction();
      break;
    case "collect-import":
      collectImportCrate();
      break;
    case "recruit":
      recruitTroops();
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
  const limit = player.harvestLimit || 0;
  if (player.harvestsLeft <= 0) {
    logEvent("🌱 The fields need rest. Wait until next turn to harvest again.");
    return;
  }
  const { totals } = calculateProductionTotals();
  if (!Object.keys(totals).length) {
    logEvent("🌾 Your production buildings have nothing ready to collect.");
    return;
  }
  const adjustedTotals = applyEventProductionModifiers(totals);
  const eventBoosts = getActiveEvents();
  const eventText = eventBoosts.length
    ? ` Boosted by ${eventBoosts.map(event => event.name).join(", ")}.`
    : "";
  spendEnergyAndGold(HARVEST_ENERGY_COST, 0, null, () => {
    depositProducedResources(adjustedTotals);
    player.harvestsLeft = Math.max(0, player.harvestsLeft - 1);
    logEvent(
      `🌾 Harvest collected ${formatResourceTotals(adjustedTotals)} (${player.harvestsLeft}/${limit} harvests left).${eventText}`
    );
    grantLegacyHarvestCrate();
    recalcHarvestedGoodsValue();
    renderResourcePanel();
  });
}

function grantLegacyHarvestCrate() {
  const goodsPool = getActiveHarvestGoods();
  if (!goodsPool.length) return;
  const totalWeight = goodsPool.reduce((sum, good) => sum + (good.weight || 1), 0);
  let roll = Math.random() * totalWeight;
  let bounty = goodsPool[0];
  for (const good of goodsPool) {
    roll -= good.weight || 1;
    if (roll <= 0) {
      bounty = good;
      break;
    }
  }
  if (!player.harvestedGoods) player.harvestedGoods = {};
  player.harvestedGoods[bounty.key] = (player.harvestedGoods[bounty.key] || 0) + 1;
  logEvent(`📦 Bonus crate recovered: ${bounty.emoji} ${bounty.name}.`);
}

function startFestivalAction() {
  if (!hasResources(FESTIVAL_COST)) {
    logEvent("🎉 You need more fruits and wheat to host a festival.");
    return;
  }
  if (!spendResources(FESTIVAL_COST)) {
    logEvent("🎉 Supplies vanished before the festivities could begin.");
    return;
  }
  startFestival(announceWorldEvent);
  logEvent("🎊 Festival preparations begin across the realm.");
  renderResourcePanel();
  renderHUD();
}

function performTrade(selectedKey, onSuccess) {
  if (player.tradePosts <= 0) {
    logEvent("🏚️ You need a Trading Post before you can export goods.");
    return;
  }
  if (player.tradesRemaining <= 0) {
    logEvent("🚫 All trade missions have been used this turn.");
    return;
  }
  if (!selectedKey) {
    logEvent("❌ Choose goods to export first.");
    return;
  }
  const available = player.harvestedGoods[selectedKey] || 0;
  if (available <= 0) {
    logEvent("🌾 No harvested goods ready for export.");
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
  spendEnergyAndGold(
    COMMERCE_TRADE_COST.energy,
    COMMERCE_TRADE_COST.gold,
    `🚚 Exported ${good.emoji} ${good.name}.`,
    () => {
      player.harvestedGoods[selectedKey] = Math.max(
        0,
        (player.harvestedGoods[selectedKey] || 0) - 1
      );
      player.tradesRemaining = Math.max(0, player.tradesRemaining - 1);
      recalcHarvestedGoodsValue();
      const addedGold = grantGold(goldEarned);
      const capNote = addedGold < goldEarned ? " (vaults full)" : "";
      logEvent(
        `💹 Traders return with ${addedGold} gold${capNote} (Economy ×${economyMultiplier.toFixed(
          2
        )}, Posts ×${tradeStrength.toFixed(2)}).`
      );
      if (typeof onSuccess === "function") onSuccess();
      renderHUD();
    }
  );
}

function collectImportCrate(onSuccess) {
  if (player.imports <= 0) {
    logEvent("📭 No imports to collect!");
    return;
  }
  const importItem = importItems[Math.floor(Math.random() * importItems.length)];
  const bonusNames = [];
  const boosts = importItem.statBoosts || {};
  if (boosts.happiness) bonusNames.push(`${boosts.happiness} happiness`);
  if (boosts.protection) bonusNames.push(`${boosts.protection} protection`);
  if (boosts.troops) bonusNames.push(`${boosts.troops} troops`);
  if (boosts.energy) bonusNames.push(`${boosts.energy} energy`);
  const bonusMsg = bonusNames.length ? ` and bonus ${bonusNames.join(", ")}` : "";
  spendEnergyAndGold(
    0,
    0,
    `📥 Collected imported ${importItem.name}!`,
    () => {
      player.imports = Math.max(0, player.imports - 1);
      if (boosts.happiness) player.happiness += boosts.happiness;
      if (boosts.protection) player.protection += boosts.protection;
      if (boosts.troops) player.troops += boosts.troops;
      if (boosts.energy) player.energy += boosts.energy;
      const addedGold = grantGold(importItem.price);
      logEvent(`💰 Shipment yielded ${addedGold} gold${bonusMsg}.`);
      if (typeof onSuccess === "function") onSuccess();
      renderHUD();
    }
  );
}

function recruitTroops() {
  const recruits = Math.max(1, player.prowess + (player.recruitBonus || 0));
  spendEnergyAndGold(
    RECRUIT_COST.energy,
    RECRUIT_COST.gold,
    `🪖 Recruited ${recruits} fresh troops.`,
    () => {
      player.troops += recruits;
    }
  );
}

function attemptRelicDelve() {
  if (!hasAvailableDelveRelics()) {
    logEvent("🕳️ There are no undiscovered relics left to delve.");
    return;
  }
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
      renderHUD();
    }
  );
}

function showInventoryPanel() {
  openActionModal("📦 Inventory Ledger", body => {
    const info = document.createElement("div");
    info.className = "inventory-info";
    info.innerHTML = `
      <div>🚢 Imports waiting: <strong>${player.imports}</strong></div>
      <div>🌾 Harvests left: <strong>${player.harvestsLeft}/${player.harvestLimit || 0}</strong></div>
      <div>📦 Trades left: <strong>${player.tradesRemaining}/${player.tradePosts || 0}</strong></div>
      <div>🛒 Trade Posts: <strong>${player.tradePosts || 0}</strong></div>
      <div>🏦 Gold Storage: <strong>${player.gold}/${getGoldStorageCapacity()}</strong></div>
    `;
    const goodsGrid = document.createElement("div");
    goodsGrid.className = "inventory-goods";
    getHarvestCatalog().forEach(g => {
      const item = document.createElement("div");
      item.className = "inventory-good";
      item.innerHTML = `<span>${g.emoji}</span>
        <div>
          <strong>${g.name}</strong>
          <small>${(player.harvestedGoods && player.harvestedGoods[g.key]) || 0} crate(s)</small>
        </div>`;
      goodsGrid.appendChild(item);
    });
    body.appendChild(info);
    body.appendChild(goodsGrid);
  });
}

function showCommerceModal() {
  openActionModal("🏛️ Trade & Imports", body => {
    renderCommerceContent(body);
  });
}

function renderCommerceContent(container) {
  container.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "inventory-info commerce-info";
  summary.innerHTML = `
    <div>🛒 Trade Posts: <strong>${player.tradePosts || 0}</strong></div>
    <div>🚚 Trades left: <strong>${player.tradesRemaining}/${player.tradePosts || 0}</strong></div>
    <div>📦 Goods stored: <strong>${getTotalHarvestedGoods()}</strong></div>
    <div>📥 Imports waiting: <strong>${player.imports}</strong></div>
  `;
  container.appendChild(summary);
  const quickTip = document.createElement("p");
  quickTip.className = "commerce-note";
  quickTip.textContent = "Tip: use 📥 Collect Imports in the main action list for quick crates.";
  container.appendChild(quickTip);
  if (player.faction && factionHarvestGoods[player.faction.name]) {
    const note = document.createElement("p");
    note.className = "commerce-note";
    const names = factionHarvestGoods[player.faction.name].map(g => g.name).join(", ");
    note.textContent = `${player.faction.emoji} Specialty harvests active: ${names}.`;
    container.appendChild(note);
  }

  const exportsSection = document.createElement("section");
  exportsSection.className = "commerce-section";
  exportsSection.innerHTML = "<h3>Exports</h3>";
  const exportable = getHarvestCatalog().filter(
    good => (player.harvestedGoods && player.harvestedGoods[good.key]) > 0
  );
  if (!exportable.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "commerce-note";
    emptyNote.textContent = "No goods are ready. Harvest fields to create stockpiles.";
    exportsSection.appendChild(emptyNote);
  } else {
    const goodsGrid = document.createElement("div");
    goodsGrid.className = "inventory-goods";
    const economyMultiplier = Math.max(1, Math.pow(player.economy / 5 + 1, 1.05));
    const tradeStrength = 1 + (player.tradePosts || 0) * 0.15;
    exportable.forEach(good => {
      const count = (player.harvestedGoods && player.harvestedGoods[good.key]) || 0;
      const payout = Math.round(good.value * economyMultiplier * tradeStrength);
      const card = document.createElement("div");
      card.className = "inventory-good commerce-good";
      card.innerHTML = `
        <span>${good.emoji}</span>
        <div>
          <strong>${good.name}</strong>
          <small>${count} crate(s)</small>
          <small>≈ ${payout} gold</small>
        </div>
      `;
      const button = document.createElement("button");
      button.textContent = `Send Caravan (⚡${COMMERCE_TRADE_COST.energy})`;
      const disabled =
        player.tradePosts <= 0 ||
        player.tradesRemaining <= 0 ||
        count <= 0 ||
        player.energy < COMMERCE_TRADE_COST.energy;
      button.disabled = disabled;
      button.addEventListener("click", () => performTrade(good.key, () => renderCommerceContent(container)));
      card.appendChild(button);
      goodsGrid.appendChild(card);
    });
    exportsSection.appendChild(goodsGrid);
  }
  if (player.tradePosts <= 0) {
    const note = document.createElement("p");
    note.className = "commerce-note";
    note.textContent = "Build Trading Posts to unlock caravans.";
    exportsSection.appendChild(note);
  }

  const importSection = document.createElement("section");
  importSection.className = "commerce-section";
  importSection.innerHTML = "<h3>Imports</h3>";
  const importInfo = document.createElement("p");
  importInfo.textContent = "Collect shipments for gold and random bonuses.";
  importSection.appendChild(importInfo);
  const importBtn = document.createElement("button");
  importBtn.textContent = player.imports > 0 ? `Collect Import (${player.imports} waiting)` : "No imports ready";
  importBtn.disabled = player.imports <= 0;
  importBtn.addEventListener("click", () => collectImportCrate(() => renderCommerceContent(container)));
  importSection.appendChild(importBtn);
  const importHelp = document.createElement("p");
  importHelp.className = "commerce-note";
  importHelp.textContent = "Imports can include troops, happiness, protection, and gold.";
  importSection.appendChild(importHelp);

  const splitWrapper = document.createElement("div");
  splitWrapper.className = "commerce-split";
  const leftColumn = document.createElement("div");
  leftColumn.className = "commerce-column";
  const rightColumn = document.createElement("div");
  rightColumn.className = "commerce-column";
  leftColumn.appendChild(exportsSection);
  rightColumn.appendChild(importSection);
  splitWrapper.appendChild(leftColumn);
  splitWrapper.appendChild(rightColumn);
  container.appendChild(splitWrapper);
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

function canPayActionCost(btn) {
  const energyCost = Number(btn?.dataset?.costEnergy || 0);
  const goldCost = Number(btn?.dataset?.costGold || 0);
  if (energyCost && player.energy < energyCost) return false;
  if (goldCost && player.gold < goldCost) return false;
  return true;
}

function hasBuildableOptions() {
  const clearing = getSelectedClearing();
  if (!clearing) return false;
  const structuresHere = getStructuresInClearing(clearing.id);
  return buildingDefinitions.some(def => evaluateBlueprintAvailability(def, clearing, structuresHere).canBuild);
}

function canHarvestNow() {
  const limit = player.harvestLimit || 0;
  if (!limit || player.harvestsLeft <= 0) return false;
  return getProductionEntries().length > 0;
}

function hasCommerceOpportunity() {
  const hasImports = player.imports > 0;
  const canTrade =
    (player.tradePosts || 0) > 0 &&
    (player.tradesRemaining || 0) > 0 &&
    getTotalHarvestedGoods() > 0;
  return hasImports || canTrade;
}

function hasUsableRelic() {
  return (player.relics || []).some(name => name && name !== "None");
}

function hasBattleTargets() {
  return player.troops > 0 && getBattleTargets().length > 0;
}

function formatActionCost(btn) {
  const custom = btn?.dataset?.costCustom;
  if (custom) return custom;
  const energy = Number(btn?.dataset?.costEnergy || 0);
  const gold = Number(btn?.dataset?.costGold || 0);
  const parts = [];
  if (energy) parts.push(`⚡${energy}`);
  if (gold) parts.push(`💰${gold}`);
  return parts.length ? parts.join(" • ") : "Free";
}

function updateActionIndicators() {
  document.querySelectorAll("#actionButtons button").forEach(btn => {
    const actionId = btn.dataset.action;
    const labelEl = btn.querySelector("span");
    const detailEl = btn.querySelector("small");
    if (!detailEl) return;
    if (labelEl?.dataset?.defaultText && !labelEl.textContent) {
      labelEl.textContent = labelEl.dataset.defaultText;
    }
    const costText = `Cost: ${formatActionCost(btn)}`;
    const baseDetail = detailEl.dataset.defaultText || "";
    let detailText = baseDetail ? `${costText} • ${baseDetail}` : costText;
    let canUse = canPayActionCost(btn);

    switch (actionId) {
      case "harvest":
        if (labelEl) {
          labelEl.textContent = `🌾 Harvest (${player.harvestsLeft}/${player.harvestLimit || 0})`;
        }
        detailText += ` • Production sites: ${getProductionEntries().length}`;
        if (!canHarvestNow()) {
          detailText += " • Build production structures to unlock harvests.";
          canUse = false;
        }
        break;
      case "battle":
        detailText += ` • Troops ready: ${player.troops}`;
        if (!hasBattleTargets()) {
          detailText += " • No eligible foes.";
          canUse = false;
        }
        break;
      case "build":
        if (!selectedClearingId) {
          detailText += " • Select a clearing on the map.";
          canUse = false;
        } else if (!hasBuildableOptions()) {
          detailText += " • No structures available for that clearing.";
          canUse = false;
        }
        break;
      case "commerce":
        if (labelEl) {
          labelEl.textContent = `🏛️ Commerce (${player.tradesRemaining}/${player.tradePosts || 0})`;
        }
        detailText += ` • Imports waiting: ${player.imports}`;
        if (!hasCommerceOpportunity()) {
          detailText += " • Nothing ready to trade or collect.";
          canUse = false;
        }
        break;
      case "collect-import":
        detailText += ` • Imports waiting: ${player.imports}`;
        if (player.imports <= 0) {
          detailText += " • No shipments to open.";
          canUse = false;
        }
        break;
      case "festival":
        detailText += " • Costs fruits & wheat";
        if (!hasResources(FESTIVAL_COST)) {
          detailText += " • Need more supplies.";
          canUse = false;
        }
        break;
      case "delve":
        if (labelEl) {
          labelEl.textContent = `🕳️ Delve (${availableDelveRelics.size} unclaimed)`;
        }
        if (!hasAvailableDelveRelics()) {
          detailText += " • Vaults exhausted.";
          canUse = false;
        }
        break;
      case "recruit":
        detailText += ` • Gain ${Math.max(1, player.prowess + (player.recruitBonus || 0))} troops`;
        break;
      case "use-relic": {
        const ownedRelics = (player.relics || []).filter(name => name && name !== "None").length;
        detailText += ` • Relics owned: ${ownedRelics}`;
        if (!ownedRelics) {
          detailText += " • No relics available.";
          canUse = false;
        }
        break;
      }
      case "inventory":
        detailText += ` • Imports: ${player.imports}`;
        break;
      case "end-turn":
        detailText = "Recover energy, refresh harvests and trade missions.";
        break;
      default:
        break;
    }
    detailEl.textContent = detailText;
    btn.disabled = !canUse;
  });
}

function buildMenu() {
  const clearing = getSelectedClearing();
  if (!clearing) {
    logEvent("📍 Select a clearing on the map before building.");
    return;
  }
  const structuresHere = getStructuresInClearing(clearing.id);
  openActionModal(`🔨 Build in Clearing #${clearing.id}`, body => {
    const summary = document.createElement("p");
    summary.textContent = `Terrain: ${clearing.terrain}${clearing.rarity ? ` • ${clearing.rarity}` : ""}`;
    summary.className = "clearing-summary";
    body.appendChild(summary);
    const grid = document.createElement("div");
    grid.className = "build-grid";
    buildingDefinitions.forEach(def => {
      const { canBuild, reason, cost } = evaluateBlueprintAvailability(def, clearing, structuresHere);
      const card = document.createElement("button");
      card.className = "build-card";
      card.disabled = !canBuild;
      card.innerHTML = `
        <strong>${def.icon || "🏗️"} ${def.name}</strong>
        <p>${def.type === "housing" ? `+${def.beds} beds` : def.produces ? formatProductionOutput(def) : ""}</p>
        ${renderTerrainSupport(def)}
        <div class="build-cost">${renderCostLines(cost)}</div>
        ${reason && !canBuild ? `<small class="build-locked">${reason}</small>` : ""}
      `;
      if (canBuild) {
        card.addEventListener("click", () => {
          closeActionModal();
          executeConstruction(def, clearing);
        });
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function formatProductionOutput(definition) {
  if (!definition?.produces) return "";
  return Object.entries(definition.produces)
    .map(([key, amount]) => `${resourceLabelMap[key] || key}: +${amount}`)
    .join("<br>");
}

function renderTerrainSupport(definition) {
  if (!definition.supportedTerrains) return "";
  return `<small>Terrains: ${definition.supportedTerrains.join(", ")}</small>`;
}

function renderCostLines(cost = {}) {
  if (!Object.keys(cost).length) return "Cost: —";
  return Object.entries(cost)
    .map(([resource, amount]) => `${resourceLabelMap[resource] || resource}: ${amount}`)
    .join("<br>");
}

function executeConstruction(definition, clearing) {
  const result = constructBuilding({ clearingId: clearing.id, blueprintKey: definition.key });
  if (!result.success) {
    logEvent(`🚫 Could not build ${definition.name}: ${result.reason || "unknown issue"}.`);
    return;
  }
  if (!Array.isArray(player.buildings)) player.buildings = [];
  player.buildings.push(definition.name);
  logEvent(`${definition.icon || "🏗️"} Built ${definition.name} in clearing #${clearing.id}.`);
  if (definition.type === "production") {
    refreshHarvestAvailability();
  }
  renderHUD();
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

function queuePlayerPrompt(prompt) {
  if (!Array.isArray(player.pendingPlayerPrompts)) {
    player.pendingPlayerPrompts = [];
  }
  if (
    prompt.type &&
    prompt.faction &&
    player.pendingPlayerPrompts.some(p => p.type === prompt.type && p.faction === prompt.faction)
  ) {
    return;
  }
  player.pendingPlayerPrompts.push(prompt);
}

function showNextPlayerPrompt() {
  if (!Array.isArray(player.pendingPlayerPrompts) || !player.pendingPlayerPrompts.length) return;
  const prompt = player.pendingPlayerPrompts[0];
  openActionModal(prompt.title, body => {
    const message = document.createElement("p");
    message.textContent = prompt.message;
    body.appendChild(message);
    const controls = document.createElement("div");
    controls.className = "commerce-section";
    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = prompt.acceptLabel || "Accept";
    acceptBtn.addEventListener("click", () => {
      prompt.onAccept?.();
      player.pendingPlayerPrompts.shift();
      closeActionModal();
      showNextPlayerPrompt();
    });
    const declineBtn = document.createElement("button");
    declineBtn.textContent = prompt.declineLabel || "Decline";
    declineBtn.addEventListener("click", () => {
      prompt.onDecline?.();
      player.pendingPlayerPrompts.shift();
      closeActionModal();
      showNextPlayerPrompt();
    });
    controls.appendChild(acceptBtn);
    controls.appendChild(declineBtn);
    body.appendChild(controls);
  });
}

function endTurn() {
  const restored = calcStartingEnergy(player) + (player.energyBonus || 0);
  player.energy += restored;
  logEvent(`🌙 Turn ended. Recovered ${restored} energy (total ${player.energy}).`);
  if (player.tradePostIncome) {
    const income = grantGold(player.tradePostIncome);
    const overflowNote = income < player.tradePostIncome ? " Your vaults overflow." : "";
    logEvent(`📦 Trading Posts delivered ${income} gold.${overflowNote}`);
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
  player.harvestsLeft = player.harvestLimit || 0;
  player.tradesRemaining = player.tradePosts || 0;
  player.imports = Math.floor(Math.random() * 5) + 1;
  processAIFactionTurns();
  advanceEvents(announceWorldEvent);
  maybeTriggerRandomEvent(announceWorldEvent);
  refreshHarvestAvailability();
  renderHUD();
  showNextPlayerPrompt();
}

/////////////////////////////////////
///// PLAYER STATE & INIT /////
/////////////////////////////////////
let player = {
  faction: null,
  energy: 0,
  gold: 0,
  goldStorageBase: BASE_GOLD_STORAGE,
  goldStorageBonus: 0,
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
  harvestsLeft: 0,
  harvestLimit: 0,
  harvestedGoods: {},
  harvestedGoodsValue: 0,
  tradePosts: 0,
  tradesRemaining: 0,
  extraHarvestGoods: [],
  recruitBonus: 0,
  energyBonus: 0,
  battleBonus: 0,
  relicShield: 0,
  pendingPeaceOffers: [],
  pendingPlayerPrompts: [],
  unlockedAbilityTags: new Set(),
  gainGold(amount) {
    return grantGold(amount, this);
  },
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
  initMapUI({
    gridElementId: "clearingGrid",
    tooltipElementId: "clearingTooltip",
    onSelect: id => {
      selectedClearingId = id;
      renderHUD();
    },
  });
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
}); 
function startGame(faction) {
  resetEventState();
  resetCombatState();
  worldEventFeed = [];
  startPlayerGame({
    player,
    faction,
    updateDerivedStats,
    renderHUD,
    logEvent,
    handleAction,
    renderFactionAbilities,
  });
  const { playerClearingId } = initializeWorldMap(faction, factions);
  selectedClearingId = playerClearingId ?? null;
  player.currentClearingId = selectedClearingId;
  player.goldStorageBase = BASE_GOLD_STORAGE;
  player.goldStorageBonus = 0;
  enforceGoldCapacity();
  refreshHarvestAvailability();
  renderHUD();
  renderWorldEventFeed();
  markRelicClaimed(faction.startingRelic);
  factionRelics.set(faction.name, null);
  player.pendingPeaceOffers = [];
  player.extraHarvestGoods = [];
  player.pendingPlayerPrompts = [];
  initializeAIStates(faction);
}
 
