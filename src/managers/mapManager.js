/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////

/////////////////////////////////////
/// CONSTANTS                    ///
/////////////////////////////////////
export const GRID_WIDTH = 5;
export const CLEARING_COUNT = GRID_WIDTH * GRID_WIDTH;
export const NEUTRAL_OWNER = "Wilderness";

const terrainWeights = [
  { type: "Meadow", weight: 24 },
  { type: "Forest", weight: 16 },
  { type: "Hills", weight: 12 },
  { type: "Coast", weight: 6 },
  { type: "Mountains", weight: 8 },
  { type: "River", weight: 6 },
  { type: "Marsh", weight: 5 },
  { type: "Ocean", weight: 3 },
  { type: "Deep Ocean", weight: 1 },
  { type: "Crystal Cavern", weight: 1 },
  { type: "Ancient Grove", weight: 1 },
];

const beastFriendlyTerrains = new Set(["Deep Ocean", "Mountains"]);

/////////////////////////////////////
/// STATE                         ///
/////////////////////////////////////
let mapClearings = [];
const clearingLookup = new Map();
const factionCapitals = new Map();
const coordsToId = new Map();
let nextClearingId = 1;
let oceanSeeded = false;

/////////////////////////////////////
/// HELPERS                       ///
/////////////////////////////////////
function coordKey(row, col) {
  return `${row},${col}`;
}

function resetMapState() {
  mapClearings = [];
  clearingLookup.clear();
  factionCapitals.clear();
  coordsToId.clear();
  nextClearingId = 1;
  oceanSeeded = false;
}

function createClearing(row, col) {
  const terrain = pickTerrain(row, col);
  const clearing = {
    id: nextClearingId,
    owner: NEUTRAL_OWNER,
    terrain,
    row,
    col,
    structures: [],
    capitalOf: null,
    rarity: terrain === "Crystal Cavern" || terrain === "Ancient Grove" ? terrain : null,
    beast: maybeSpawnBeast(terrain),
  };
  mapClearings.push(clearing);
  clearingLookup.set(clearing.id, clearing);
  coordsToId.set(coordKey(row, col), clearing.id);
  nextClearingId += 1;
  return clearing;
}

function getNeighborCoords(row, col) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];
}

function getClearingAt(row, col) {
  const id = coordsToId.get(coordKey(row, col));
  return id ? clearingLookup.get(id) || null : null;
}

function hasAdjacentTerrain(row, col, terrain) {
  return getNeighborCoords(row, col).some(coord => {
    const neighbor = getClearingAt(coord.row, coord.col);
    return neighbor?.terrain === terrain;
  });
}

function pickTerrain(row, col) {
  let choice = weightedPick(terrainWeights);
  if (choice === "Ocean") {
    if (!oceanSeeded) {
      oceanSeeded = true;
    } else if (!hasAdjacentTerrain(row, col, "Ocean")) {
      choice = weightedPick(terrainWeights.filter(entry => entry.type !== "Ocean"));
    }
  }
  if (choice === "Deep Ocean" && !hasAdjacentTerrain(row, col, "Ocean")) {
    choice = "Ocean";
  }
  return choice;
}

function maybeSpawnBeast(terrain) {
  if (!beastFriendlyTerrains.has(terrain)) return null;
  if (terrain === "Mountains" && Math.random() < 0.1) {
    return { type: "Mountain Beast", strength: 4 };
  }
  if (terrain === "Deep Ocean" && Math.random() < 0.4) {
    return { type: "Deep Leviathan", strength: 7 };
  }
  return null;
}

function weightedPick(list) {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= item.weight;
    if (roll <= 0) return item.type;
  }
  return list[list.length - 1].type;
}

function assignCapitalPositions(factionOrder) {
  const available = mapClearings.map((_, idx) => idx);
  const placements = new Map();
  const placed = [];
  const centerIndex = available.find(idx => {
    const clearing = mapClearings[idx];
    return clearing.row === 0 && clearing.col === 0;
  });
  factionOrder.forEach((faction, index) => {
    if (!available.length) return;
    let chosenIndex;
    if (index === 0 && typeof centerIndex === "number") {
      chosenIndex = centerIndex;
      available.splice(available.indexOf(centerIndex), 1);
    } else {
      chosenIndex = available.find(idx => placed.every(other => !areIndicesAdjacent(idx, other)));
      if (typeof chosenIndex !== "number") {
        chosenIndex = available[0];
      }
      available.splice(available.indexOf(chosenIndex), 1);
    }
    placements.set(faction.name, chosenIndex);
    placed.push(chosenIndex);
  });
  return placements;
}

function areIndicesAdjacent(idxA, idxB) {
  if (typeof idxA !== "number" || typeof idxB !== "number") return false;
  const clearingA = mapClearings[idxA];
  const clearingB = mapClearings[idxB];
  if (!clearingA || !clearingB) return false;
  return Math.abs(clearingA.row - clearingB.row) + Math.abs(clearingA.col - clearingB.col) === 1;
}

/////////////////////////////////////
/// PUBLIC API                    ///
/////////////////////////////////////
export function initializeMapState(playerFaction, factions = []) {
  resetMapState();
  const half = Math.floor(GRID_WIDTH / 2);
  for (let row = -half; row <= half; row += 1) {
    for (let col = -half; col <= half; col += 1) {
      createClearing(row, col);
    }
  }
  factions
    .filter(f => f.name !== playerFaction.name)
    .forEach(f => factionCapitals.set(f.name, null));
  const assignments = assignCapitalPositions([playerFaction]);
  const playerIndex = assignments.get(playerFaction.name);
  if (typeof playerIndex === "number") {
    const clearing = mapClearings[playerIndex];
    clearing.owner = playerFaction.name;
    clearing.capitalOf = playerFaction.name;
    clearing.structures = ["Keep"];
    factionCapitals.set(playerFaction.name, clearing.id);
  }
  return {
    playerClearingId: typeof playerIndex === "number" ? mapClearings[playerIndex]?.id ?? null : null,
  };
}

export function getMapClearings() {
  return mapClearings;
}

export function getClearingById(id) {
  return clearingLookup.get(id) || null;
}

export function getFactionCapital(factionName) {
  return factionCapitals.get(factionName) || null;
}

export function getFactionCapitals() {
  return factionCapitals;
}

export function setFactionCapital(factionName, clearingId) {
  factionCapitals.set(factionName, clearingId);
}

export function deleteFactionCapital(factionName) {
  factionCapitals.delete(factionName);
}

export function placeStructureOnMap(ownerName, structureName, preferredClearingId = null) {
  if (!ownerName || !structureName || !mapClearings.length) return;
  const owned = mapClearings.filter(clearing => clearing.owner === ownerName);
  if (!owned.length) return;
  let target;
  if (preferredClearingId) {
    target = owned.find(c => c.id === preferredClearingId);
  }
  if (!target) {
    owned.sort((a, b) => {
      const aCap = a.capitalOf === ownerName ? 0 : 1;
      const bCap = b.capitalOf === ownerName ? 0 : 1;
      if (aCap !== bCap) return aCap - bCap;
      return (a.structures?.length || 0) - (b.structures?.length || 0);
    });
    target = owned[0];
  }
  if (!target.structures) target.structures = [];
  target.structures.push(structureName);
}

export function exploreFromClearing(clearingId, direction) {
  const origin = getClearingById(clearingId);
  if (!origin) return { clearing: null, discovered: false };
  const offsets = {
    north: { row: -1, col: 0 },
    south: { row: 1, col: 0 },
    east: { row: 0, col: 1 },
    west: { row: 0, col: -1 },
  };
  const delta = offsets[direction?.toLowerCase()] || null;
  if (!delta) return { clearing: null, discovered: false };
  const targetRow = origin.row + delta.row;
  const targetCol = origin.col + delta.col;
  const existing = getClearingAt(targetRow, targetCol);
  if (existing) return { clearing: existing, discovered: false };
  const clearing = createClearing(targetRow, targetCol);
  return { clearing, discovered: true };
}

export function clearBeastFromClearing(clearingId) {
  const clearing = getClearingById(clearingId);
  if (clearing) {
    clearing.beast = null;
  }
}
