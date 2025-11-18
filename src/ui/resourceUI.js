/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { getAllResources, getResourceDefinitions } from "../managers/resourceManager.js";

/////////////////////////////////////
/// FUNCTIONS                     ///
/////////////////////////////////////
export function renderResourcePanel(containerId = "resourcePanel") {
  const container = document.getElementById(containerId);
  if (!container) return;
  const wallet = getAllResources();
  const defs = getResourceDefinitions();
  container.innerHTML = defs
    .map(def => {
      const amount = wallet[def.key] ?? 0;
      return `
        <div class="resource-row">
          <span>${def.icon}</span>
          <strong>${def.name}</strong>
          <span>${amount}</span>
        </div>
      `;
    })
    .join("");
}
