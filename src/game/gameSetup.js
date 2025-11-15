/////////////////////////////////////
///// GAME START HELPERS /////
/////////////////////////////////////
import { calcStartingEnergy } from "../utils/statCalc.js";

export function startPlayerGame({
  player,
  faction,
  updateDerivedStats,
  renderHUD,
  logEvent,
  handleAction,
  renderFactionAbilities,
}) {
  applyStartingStats(player, faction);
  player.relics = [faction.startingRelic || "None"];
  player.buildings = [];
  player.declaredWars = [];
  player.alliances = [];
  player.tradePostIncome = 0;
  player.economyBonus = 0;
  player.relicsUsedThisTurn = new Set();
  player.abilitiesUsedThisTurn = new Map();
  player.harvestLimit = player.harvestLimit || 5;
  player.harvestsLeft = player.harvestLimit;
  player.harvestedGoods = {};
  player.harvestedGoodsValue = 0;
  player.tradePosts = 0;
  player.tradesRemaining = 0;
  updateDerivedStats();
  player.energy = calcStartingEnergy(player);
  renderHUD();
  setupActionButtons(handleAction);
  if (typeof renderFactionAbilities === "function") {
    renderFactionAbilities();
  }
  logEvent(`🌿 Welcome, ${faction.name}!`);
}

export function setupActionButtons(handleAction) {
  const actionArea = document.getElementById("actionButtons");
  if (!actionArea) return;
  actionArea.innerHTML = "";
  const actions = [
    { id: "diplomacy", label: "🕊️ Diplomacy", detail: "Manage alliances and rivalries." },
    { id: "battle", label: "🛡️ Battle", detail: "March troops into combat." },
    { id: "build", label: "🔨 Build", detail: "Raise new structures." },
    { id: "harvest", label: "🌾 Harvest", detail: "Gather crops and supplies." },
    { id: "trade", label: "📦 Trade", detail: "Exchange goods for bonuses." },
    { id: "collect", label: "💰 Collect Imports", detail: "Gather income from imports." },
    { id: "delve", label: "🕳️ Delve Relic", detail: "Spare no expense for a relic." },
    { id: "use-relic", label: "🔮 Use Relic", detail: "Awaken an owned relic." },
    { id: "inventory", label: "📚 Inventory", detail: "Review goods & logistics." },
  ];
  actions.forEach(a => {
    const btn = document.createElement("button");
    btn.classList.add("action-ability-button");
    const label = document.createElement("span");
    label.textContent = a.label;
    const detail = document.createElement("small");
    detail.textContent = a.detail ?? "";
    btn.appendChild(label);
    btn.appendChild(detail);
    btn.dataset.action = a.id;
    btn.addEventListener("click", () => handleAction(a.id));
    actionArea.appendChild(btn);
  });
  const endTurnBtn = document.getElementById("endTurnBtn");
  if (endTurnBtn) {
    endTurnBtn.addEventListener("click", () => handleAction("end-turn"));
  }
}

function applyStartingStats(player, faction) {
  player.faction = faction;
  player.gold = parseTraitValue(faction?.defaultTraits?.economy) * 10;
  player.troops = parseTraitValue(faction?.defaultTraits?.prowess) * 5;
  player.happiness = 1;
  player.protection = 1;
  player.imports = Math.floor(Math.random() * 5) + 1;
  player.canTrade = true;
  player.relics = [];
  player.tradePostIncome = 0;
  player.economyBonus = 0;
}

function parseTraitValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}
