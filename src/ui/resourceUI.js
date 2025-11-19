/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import {
  getAllResources,
  getResourceDefinitions,
  getDiscoveredResources,
} from "../managers/resourceManager.js";

/////////////////////////////////////
/// FUNCTIONS                     ///
/////////////////////////////////////
export function renderResourcePanel(containerId = "resourcePanel") {
  const container = document.getElementById(containerId);
  if (!container) return;
  const wallet = getAllResources();
  const defs = getResourceDefinitions();
  const discovered = getDiscoveredResources();
  const rows = [];
  const grouped = new Map();

  defs.forEach(def => {
    if (!discovered.has(def.key)) return;
    const amount = wallet[def.key] ?? 0;
    if (def.group) {
      const list = grouped.get(def.group) || [];
      list.push({ ...def, amount });
      grouped.set(def.group, list);
      return;
    }
    rows.push(renderRow(def, amount));
  });

  if (grouped.has("ore")) {
    rows.push(renderGroup("⛏️ Ores", grouped.get("ore")));
  }

  container.innerHTML =
    rows.join("") || `<p class="resource-row">No resources discovered yet.</p>`;
}

function renderRow(def, amount) {
  return `
    <div class="resource-row">
      <span>${def.icon}</span>
      <strong>${def.name}</strong>
      <span>${amount}</span>
    </div>
  `;
}

function renderGroup(label, entries = []) {
  const body = entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => renderRow(entry, entry.amount))
    .join("");
  return `
    <div class="resource-group">
      <strong>${label}</strong>
      ${body}
    </div>
  `;
}
