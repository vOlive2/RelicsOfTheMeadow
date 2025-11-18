/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { buildStructure, getStructuresInClearing } from "./craftingManager.js";
import { getClearingById } from "./mapManager.js";

/////////////////////////////////////
/// FUNCTIONS                     ///
/////////////////////////////////////
export function constructBuilding({ clearingId, blueprintKey }) {
  const clearing = getClearingById(clearingId);
  if (!clearing) return { success: false, reason: "Unknown clearing" };
  const result = buildStructure({
    clearingId,
    key: blueprintKey,
    terrain: clearing.terrain,
    rarity: clearing.rarity,
  });
  if (result.success) {
    if (!clearing.structures) clearing.structures = [];
    if (result.replaced) {
      const replacedIndex = clearing.structures.findIndex(name => name === result.replaced);
      if (replacedIndex >= 0) {
        clearing.structures.splice(replacedIndex, 1);
      }
    }
    clearing.structures.push(result.instance.name);
  }
  return result;
}

export function getClearingStructures(clearingId) {
  return getStructuresInClearing(clearingId);
}
