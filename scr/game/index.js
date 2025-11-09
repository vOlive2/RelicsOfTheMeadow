import { StateManager } from './stateManager.js';

const state = new StateManager();
state.loadData();

// Example usage:
state.factions['crimson_horde'].addRelic('horn_of_fury');
state.factions['crimson_horde'].traits.prowess += 2;

console.log(state.factions['crimson_horde']);
state.saveGame();
