/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { buildingDefinitions } from "../data/buildings.js";
import { addResource, spendResources } from "./resourceManager.js";
import { adjustHappiness, setHousingCapacity } from "./populationManager.js";

/////////////////////////////////////
/// CONSTANTS                    ///
/////////////////////////////////////
const DEFAULT_BLUEPRINTS = ["basicHouse", "farm", "orchard", "herbGarden", "mineShaft"];
const COST_STEP = 0.2;
const COST_ACCELERATION = 0.3;
const ANCIENT_GROVE_BOOST = new Set(["farm", "orchard", "herbGarden"]);
const CRYSTAL_CAVERN_BOOST = new Set(["mineShaft", "deepMineShaft", "grandMine", "mineHub"]);

/////////////////////////////////////
/// STATE                         ///
/////////////////////////////////////
let unlockedBlueprints = new Set(DEFAULT_BLUEPRINTS);
let structures = new Map(); // clearingId -> array of building instances
let housingCapacityCache = 0;

/////////////////////////////////////
/// HELPERS                       ///
/////////////////////////////////////
function getDefinition(key) {
  return buildingDefinitions.find(def => def.key === key) || null;
}

function recalcHousingCapacity() {
  housingCapacityCache = 0;
  structures.forEach(list => {
    list.forEach(instance => {
      if (instance.beds) {
        housingCapacityCache += instance.beds;
      }
    });
  });
  setHousingCapacity(housingCapacityCache);
}

function getStructureCountByKey(key) {
  let count = 0;
  structures.forEach(list => {
    list.forEach(instance => {
      if (instance.key === key) count += 1;
    });
  });
  return count;
}

function scaleCost(cost = {}, builtCount) {
  const multiplier = 1 + builtCount * COST_STEP + Math.max(0, builtCount - 1) * COST_ACCELERATION;
  return Object.fromEntries(
    Object.entries(cost).map(([resource, amount]) => [resource, Math.round(amount * multiplier)])
  );
}

function getProductionMultiplier(def, rarity) {
  if (!rarity || def.type !== "production") return 1;
  if (rarity === "Ancient Grove" && ANCIENT_GROVE_BOOST.has(def.key)) return 3;
  if (rarity === "Crystal Cavern" && CRYSTAL_CAVERN_BOOST.has(def.key)) return 3;
  return 1;
}

/////////////////////////////////////
/// API                           ///
/////////////////////////////////////
export function resetCraftingState() {
  unlockedBlueprints = new Set(DEFAULT_BLUEPRINTS);
  structures = new Map();
  recalcHousingCapacity();
}

export function unlockBlueprint(key) {
  unlockedBlueprints.add(key);
}

export function hasBlueprint(key) {
  return unlockedBlueprints.has(key);
}

export function getScaledCostForBlueprint(key) {
  const def = getDefinition(key);
  if (!def) return {};
  const builtCount = getStructureCountByKey(key);
  return scaleCost(def.cost || {}, builtCount);
}

export function getStructuresInClearing(clearingId) {
  const list = structures.get(clearingId);
  return list ? [...list] : [];
}

export function buildStructure({ clearingId, key, terrain, rarity }) {
  const def = getDefinition(key);
  if (!def) return { success: false, reason: "Unknown blueprint" };
  if (!hasBlueprint(key)) return { success: false, reason: "Blueprint locked" };
  if (def.supportedTerrains && !def.supportedTerrains.includes(terrain)) {
    return { success: false, reason: "Terrain unsuitable" };
  }
  const list = structures.get(clearingId) || [];
  let replaceIndex = -1;
  let replacedInstance = null;
  if (def.upgradeFrom) {
    replaceIndex = list.findIndex(instance => instance.key === def.upgradeFrom);
    if (replaceIndex === -1) {
      const previous = getDefinition(def.upgradeFrom);
      const label = previous?.name || "previous tier";
      return { success: false, reason: `Requires existing ${label}` };
    }
    replacedInstance = list[replaceIndex];
  }
  const scaledCost = getScaledCostForBlueprint(key);
  if (!spendResources(scaledCost)) {
    return { success: false, reason: "Insufficient materials" };
  }
  const multiplier = getProductionMultiplier(def, rarity);
  const instance = {
    key,
    name: def.name,
    beds: def.beds || 0,
    produces: def.produces || null,
    happinessBonus: def.happinessBonus || 0,
    icon: def.icon || null,
    multiplier,
    rarity,
    terrain,
  };
  if (replaceIndex >= 0) {
    list.splice(replaceIndex, 1, instance);
  } else {
    list.push(instance);
  }
  structures.set(clearingId, list);
  if (instance.beds || replacedInstance?.beds) recalcHousingCapacity();
  if (instance.happinessBonus) adjustHappiness(instance.happinessBonus);
  return { success: true, instance, replaced: replacedInstance?.name || null };
}

export function getProductionEntries() {
  const entries = [];
  structures.forEach((list, clearingId) => {
    list.forEach(instance => {
      if (!instance.produces) return;
      entries.push({
        clearingId,
        key: instance.key,
        produces: instance.produces,
        multiplier: instance.multiplier || 1,
        name: instance.name,
      });
    });
  });
  return entries;
}

export function calculateProductionTotals() {
  const entries = getProductionEntries();
  const totals = {};
  entries.forEach(entry => {
    Object.entries(entry.produces || {}).forEach(([resource, amount]) => {
      const total = amount * (entry.multiplier || 1);
      totals[resource] = (totals[resource] || 0) + total;
    });
  });
  return { totals, entries };
}

export function addResources(resourcesObj) {
  Object.entries(resourcesObj || {}).forEach(([key, amount]) => {
    addResource(key, amount);
  });
}
