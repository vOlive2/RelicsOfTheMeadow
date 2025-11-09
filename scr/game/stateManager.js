import { loadJSONDirectory } from '../utils/fileLoader.js';
import { Faction } from './models/Faction.js';
import { Relic } from './models/Relic.js';
import fs from 'fs';
import path from 'path';

const FACTIONS_PATH = path.resolve('data/factions');
const RELICS_PATH = path.resolve('data/relics');

export class StateManager {
  constructor() {
    this.factions = {};
    this.relics = {};
  }

  loadData() {
    console.log('📦 Loading game data...');
    const factionData = loadJSONDirectory(FACTIONS_PATH);
    const relicData = loadJSONDirectory(RELICS_PATH);

    for (const [key, data] of Object.entries(factionData)) {
      this.factions[key] = new Faction(data);
    }

    for (const [key, data] of Object.entries(relicData)) {
      this.relics[key] = new Relic(data);
    }

    console.log('✅ All data loaded successfully.');
  }

  resetState() {
    console.log('🔄 Resetting world to base JSON values...');
    this.loadData();
  }

  saveGame(filePath = 'savegame.json') {
    const worldState = {
      factions: this.factions,
      relics: this.relics
    };
    fs.writeFileSync(filePath, JSON.stringify(worldState, null, 2));
    console.log(`💾 Game state saved to ${filePath}`);
  }
}
