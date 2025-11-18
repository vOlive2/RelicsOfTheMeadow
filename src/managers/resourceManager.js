/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { resources } from "../data/resources.js";

/////////////////////////////////////
/// STATE                         ///
/////////////////////////////////////
let wallet = Object.fromEntries(resources.map(r => [r.key, 0]));

/////////////////////////////////////
/// FUNCTIONS                     ///
/////////////////////////////////////
export function resetResources() {
  wallet = Object.fromEntries(resources.map(r => [r.key, 0]));
}

export function addResource(key, amount) {
  if (!wallet.hasOwnProperty(key) || typeof amount !== "number") return;
  wallet[key] = Math.max(0, wallet[key] + amount);
}

export function spendResource(key, amount) {
  if (!wallet.hasOwnProperty(key) || typeof amount !== "number") return false;
  if (wallet[key] < amount) return false;
  wallet[key] -= amount;
  return true;
}

export function hasResources(cost = {}) {
  return Object.entries(cost).every(([key, amount]) => wallet[key] >= amount);
}

export function spendResources(cost = {}) {
  if (!hasResources(cost)) return false;
  Object.entries(cost).forEach(([key, amount]) => {
    wallet[key] -= amount;
  });
  return true;
}

export function getResourceAmount(key) {
  return wallet[key] ?? 0;
}

export function getAllResources() {
  return { ...wallet };
}

export function getResourceDefinitions() {
  return resources;
}
