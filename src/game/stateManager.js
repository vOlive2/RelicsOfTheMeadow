// src/game/stateManager.js
import { loadFactions, loadRelics } from "../utils/fileLoader.js";

export const GameState = {
  factions: {},
  relics: {},
  selectedFaction: null,
};

export function initializeGameData() {
  GameState.factions = loadFactions();
  GameState.relics = loadRelics();
  console.log("✅ Factions and relics loaded successfully!");
  return GameState;
}

export function selectFaction(factionKey) {
  if (GameState.factions[factionKey]) {
    GameState.selectedFaction = factionKey;
    console.log(`🎭 Selected faction: ${factionKey}`);
  } else {
    console.error(`❌ Faction '${factionKey}' not found!`);
  }
}
