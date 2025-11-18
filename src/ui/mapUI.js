/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { getMapClearings, NEUTRAL_OWNER } from "../managers/mapManager.js";

/////////////////////////////////////
/// STATE                         ///
/////////////////////////////////////
let gridElement = null;
let tooltipElement = null;
let selectHandler = null;
let tooltipFormatter = null;

/////////////////////////////////////
/// FUNCTIONS                     ///
/////////////////////////////////////
export function initMapUI({ gridElementId, tooltipElementId, onSelect }) {
  gridElement = document.getElementById(gridElementId);
  tooltipElement = document.getElementById(tooltipElementId);
  selectHandler = typeof onSelect === "function" ? onSelect : null;
}

function showTooltip(clearing, event) {
  if (!tooltipElement || typeof tooltipFormatter !== "function") return;
  tooltipElement.innerHTML = tooltipFormatter(clearing);
  tooltipElement.classList.remove("hidden");
  const { clientX, clientY } = event;
  tooltipElement.style.left = `${clientX + 12}px`;
  tooltipElement.style.top = `${clientY + 12}px`;
}

function hideTooltip() {
  if (!tooltipElement) return;
  tooltipElement.classList.add("hidden");
}

export function renderMap({
  selectedClearingId,
  formatOwnerLabel,
  getOwnerColor,
  formatStructures,
  formatTooltip,
}) {
  if (!gridElement) return;
  tooltipFormatter = formatTooltip || null;
  const clearings = getMapClearings();
  if (!clearings.length) {
    gridElement.innerHTML = '<p class="clearing-empty">No territories mapped yet.</p>';
    return;
  }
  gridElement.innerHTML = "";
  const ordered = [...clearings].sort((a, b) => a.id - b.id);
  ordered.forEach(clearing => {
    const tile = document.createElement("button");
    const classes = ["clearing-tile"];
    if (clearing.id === selectedClearingId) classes.push("clearing-selected");
    if (clearing.capitalOf) classes.push("clearing-capital");
    if (clearing.owner && clearing.owner !== NEUTRAL_OWNER) {
      classes.push("clearing-player");
    }
    if (clearing.beast) classes.push("clearing-beast");
    tile.className = classes.join(" ");
    tile.type = "button";
    tile.style.borderColor =
      typeof getOwnerColor === "function" ? getOwnerColor(clearing.owner) : "#5ba571";
    const structures = Array.isArray(clearing.structures) ? clearing.structures : [];
    const structureText =
      typeof formatStructures === "function"
        ? formatStructures(structures)
        : structures.slice(-2).join(", ") || "—";
    tile.innerHTML = `
      <span class="clearing-id">#${clearing.id}</span>
      <span class="clearing-owner">${
        typeof formatOwnerLabel === "function"
          ? formatOwnerLabel(clearing.owner)
          : clearing.owner || "—"
      }</span>
      <span class="clearing-structures">${structureText}</span>
    `;
    tile.addEventListener("click", () => {
      if (selectHandler) selectHandler(clearing.id);
    });
    tile.addEventListener("mouseenter", event => showTooltip(clearing, event));
    tile.addEventListener("mousemove", event => showTooltip(clearing, event));
    tile.addEventListener("mouseleave", hideTooltip);
    gridElement.appendChild(tile);
  });
}
