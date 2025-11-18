/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { seasonalEvents, festivalDefinition } from "../data/events.js";
import { adjustHappiness } from "./populationManager.js";

/////////////////////////////////////
/// STATE                         ///
/////////////////////////////////////
let activeEvents = [];

/////////////////////////////////////
/// HELPERS                       ///
/////////////////////////////////////
function createEventInstance(definition, source = "world") {
  return {
    ...definition,
    source,
    turnsRemaining: definition.duration,
  };
}

function applyImmediateEffects(event) {
  if (event.effects?.happinessShift) {
    adjustHappiness(event.effects.happinessShift);
  }
}

/////////////////////////////////////
/// API                           ///
/////////////////////////////////////
export function resetEventState() {
  activeEvents = [];
}

export function getActiveEvents() {
  return activeEvents.map(event => ({
    key: event.key,
    name: event.name,
    description: event.description,
    turnsRemaining: event.turnsRemaining,
    source: event.source,
  }));
}

export function advanceEvents(onUpdate = () => {}) {
  activeEvents.forEach(event => {
    event.turnsRemaining -= 1;
  });
  const expired = activeEvents.filter(event => event.turnsRemaining <= 0);
  if (expired.length) {
    expired.forEach(event => {
      if (event.effects?.happinessShift) {
        adjustHappiness(-Math.min(2, event.effects.happinessShift));
      }
      onUpdate(`⏳ ${event.name} has ended.`);
    });
  }
  activeEvents = activeEvents.filter(event => event.turnsRemaining > 0);
}

export function maybeTriggerRandomEvent(onUpdate = () => {}) {
  if (Math.random() > 0.4) return null;
  const available = seasonalEvents.filter(
    event => !activeEvents.some(active => active.key === event.key)
  );
  if (!available.length) return null;
  const definition = available[Math.floor(Math.random() * available.length)];
  const instance = createEventInstance(definition, "seasonal");
  activeEvents.push(instance);
  applyImmediateEffects(instance);
  onUpdate(`✨ ${instance.name} begins: ${instance.description}`);
  return instance;
}

export function startFestival(onUpdate = () => {}) {
  const instance = createEventInstance(festivalDefinition, "festival");
  activeEvents.push(instance);
  applyImmediateEffects(instance);
  onUpdate(`🎉 ${instance.name} erupts across the realm!`);
  return instance;
}

export function applyEventProductionModifiers(totals = {}) {
  let adjusted = { ...totals };
  activeEvents.forEach(event => {
    const effects = event.effects || {};
    if (effects.productionMultiplier) {
      adjusted = Object.fromEntries(
        Object.entries(adjusted).map(([resource, amount]) => [
          resource,
          Math.round(amount * effects.productionMultiplier),
        ])
      );
    }
    if (effects.resourceMultipliers) {
      Object.entries(effects.resourceMultipliers).forEach(([resource, multiplier]) => {
        if (adjusted[resource]) {
          adjusted[resource] = Math.round(adjusted[resource] * multiplier);
        }
      });
    }
  });
  return adjusted;
}
