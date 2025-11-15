/////////////////////////////////////
///        MODULE IMPORTS         ///
/////////////////////////////////////
import { factions } from "../../data/factions.js";
import buildings from "../../data/buildings.js";
import { calculateResilience, calculateEconomy, calculateProwess, calcStartingEnergy } from "../utils/statCalc.js";
import { importItems } from "../../data/importItems.js";
import { battleSpoils } from "../../data/spoils.js";
import { relics as relicLibrary } from "../../data/relics.js";
import { startPlayerGame } from "./gameSetup.js";
console.log("✅ Game JS loaded!");

const relicCatalog = new Map(relicLibrary.map(relic => [relic.name, relic]));
const availableDelveRelics = new Set(relicLibrary.map(relic => relic.name));
const factionRelics = new Map();
factions.forEach(f => {
  factionRelics.set(f.name, f.startingRelic || null);
});

const harvestableGoods = [
  { key: "wheat", name: "Amber Wheat", emoji: "🌾", value: 18 },
  { key: "herbs", name: "Grove Herbs", emoji: "🌿", value: 20 },
  { key: "timber", name: "Lumber Bundles", emoji: "🪵", value: 24 },
  { key: "supplies", name: "Packed Supplies", emoji: "🎒", value: 22 },
  { key: "ore", name: "Shimmer Ore", emoji: "⛏️", value: 26 },
];
const factionHarvestGoods = {
  "The Crimson Horde": [{ key: "war_spoils", name: "War Spoils", emoji: "🩸", value: 32 }],
  "The Devoured Faith": [{ key: "relic_shard", name: "Relic Shard", emoji: "🕯️", value: 28 }],
  "The Jade Empire": [{ key: "trade_seal", name: "Trade Seal", emoji: "🐉", value: 30 }],
  "The Meadowfolk Union": [{ key: "sun_petals", name: "Sun Petals", emoji: "🌻", value: 24 }],
  "The Silken Dominion": [{ key: "silk_spool", name: "Silk Spool", emoji: "🧵", value: 27 }],
  "The Mycelial Monarchy": [{ key: "spore_bloom", name: "Spore Bloom", emoji: "🍄", value: 29 }],
};
const harvestGoodsMap = new Map();
function registerHarvestGoods(list) {
  list.forEach(good => harvestGoodsMap.set(good.key, good));
}
registerHarvestGoods(harvestableGoods);
Object.values(factionHarvestGoods).forEach(list => registerHarvestGoods(list));
const HARVEST_ENERGY_COST = 1;
const RELIC_DELVE_COST = { energy: 5, gold: 250 };
const RECRUIT_COST = { energy: 2, gold: 40 };
const COMMERCE_TRADE_COST = { energy: 1, gold: 0 };
const ALLIANCE_COST = { energy: 1, gold: 30 };
const DECLARE_WAR_COST = { energy: 2, gold: 50 };
const PEACE_COST_ENERGY = 2;
const aiStates = new Map();

function getActiveHarvestGoods() {
  const goods = [...harvestableGoods];
  const factionExtras = player?.faction ? factionHarvestGoods[player.faction.name] : null;
  if (factionExtras) goods.push(...factionExtras);
  if (player?.extraHarvestGoods?.length) goods.push(...player.extraHarvestGoods);
  return goods;
}

function getHarvestCatalog() {
  const map = new Map();
  getActiveHarvestGoods().forEach(g => {
    if (!map.has(g.key)) {
      map.set(g.key, g);
    }
  });
  return [...map.values()];
}


/////////////////////////////////////
///      DERIVED STATS & HUD      ///
/////////////////////////////////////
function updateDerivedStats() {
  player.resilience = calculateResilience(player);
  player.economy = calculateEconomy(player);
  player.prowess = calculateProwess(player);
}

function renderHUD() {
  if (!player?.faction) return;
  const f = player.faction;
  const factionBanner = document.getElementById("factionDisplay");
  factionBanner.textContent = `${f.emoji} ${f.name}`;
  factionBanner.classList.remove("status-ally", "status-war", "status-neutral");
  if (player.declaredWars.length) {
    factionBanner.classList.add("status-war");
  } else if (player.alliances.length) {
    factionBanner.classList.add("status-ally");
  } else {
    factionBanner.classList.add("status-neutral");
  }
  updateDerivedStats();
  const leftStats = [
    { label: "💖 Happiness", value: player.happiness },
    { label: "🛡️ Protection", value: player.protection },
    { label: "🪖 Troops", value: player.troops },
    { label: "💰 Gold", value: player.gold },
  ];
  const rightStats = [
    { label: "⚡ Energy", value: player.energy },
    { label: "⚔️ Prowess Rank", value: player.prowess, pillar: true },
    { label: "🧱 Resilience Tier", value: player.resilience, pillar: true },
    { label: "📊 Economy Surge", value: player.economy, pillar: true },
  ];
  const renderColumn = stats =>
    stats
      .map(
        stat => `
        <div class="stat-item${stat.pillar ? " pillar-stat" : ""}">
          <strong>${stat.label}</strong>
          <span>${stat.value}</span>
        </div>`
      )
      .join("");
  document.getElementById("factionList").innerHTML = `
    <div class="stats-column">
      ${renderColumn(leftStats)}
    </div>
    <div class="stats-column">
      ${renderColumn(rightStats)}
    </div>
  `;
  renderFactionAbilities();
  updateActionIndicators();
}

/////////////////////////////////////
///// ABILITIES & RELIC POWERS /////
/////////////////////////////////////
function renderFactionAbilities() {
  const container = document.getElementById("abilityButtons");
  if (!container) return;
  container.innerHTML = "";
  if (!player?.faction) {
    const notice = document.createElement("p");
    notice.textContent = "Select a faction to unlock abilities.";
    container.appendChild(notice);
    return;
  }
  if (!player.faction.abilities?.length) {
    const notice = document.createElement("p");
    notice.textContent = "No special abilities unlocked.";
    container.appendChild(notice);
    return;
  }
  player.faction.abilities.forEach(ability => {
    const energyCost = ability?.cost?.energy ?? 0;
    const goldCost = ability?.cost?.gold ?? 0;
    const btn = document.createElement("button");
    btn.classList.add("action-ability-button");
    btn.title = ability.desc;
    btn.disabled = player.energy < energyCost || player.gold < goldCost;

    const label = document.createElement("span");
    label.textContent = ability.name;
    const cost = document.createElement("small");
    const costParts = [];
    costParts.push(`⚡ ${energyCost}`);
    costParts.push(`💰 ${goldCost}`);
    cost.textContent = costParts.join(" • ");

    btn.appendChild(label);
    btn.appendChild(cost);
    btn.addEventListener("click", () => executeFactionAbility(ability));
    container.appendChild(btn);
  });
}

function executeFactionAbility(ability) {
  if (!ability) return;
  if (!(player.abilitiesUsedThisTurn instanceof Map)) {
    player.abilitiesUsedThisTurn = new Map();
  }
  const abilityKey = ability.id || ability.name;
  const usesSoFar = player.abilitiesUsedThisTurn.get(abilityKey) || 0;
  const maxUses = ability.usesPerTurn ?? 1;
  if (usesSoFar >= maxUses) {
    logEvent(`♻️ ${ability.name} cannot be invoked again this turn.`);
    return;
  }
  const energyCost = ability?.cost?.energy ?? 0;
  const goldCost = ability?.cost?.gold ?? 0;
  spendEnergyAndGold(energyCost, goldCost, null, () => {
    if (typeof ability.logic === "function") {
      ability.logic({
        player,
        logEvent,
        updateDerivedStats,
        acquireRelic: acquireRandomRelic,
        acquireRelicFromFaction,
      });
    } else {
      logEvent(`${ability.name} crackles, but no power responds.`);
    }
    player.abilitiesUsedThisTurn.set(abilityKey, usesSoFar + 1);
    updateDerivedStats();
    renderHUD();
  });
}

function showRelicMenu() {
  const ownedRelics = (player.relics || []).filter(name => name && name !== "None");
  if (!ownedRelics.length) {
    logEvent("No relics to activate.");
    return;
  }
  openActionModal("🔮 Relic Vault", body => {
    const grid = document.createElement("div");
    grid.className = "relic-grid";
    ownedRelics.forEach(name => {
      const relic = relicCatalog.get(name);
      if (!relic) return;
      const energyCost = relic.energyCost ?? 1;
      const used = player.relicsUsedThisTurn instanceof Set && player.relicsUsedThisTurn.has(name);
      const canAfford = player.energy >= energyCost;
      const statusText = used ? "Resting" : canAfford ? "Ready to awaken" : "Need more energy";
      const card = document.createElement("button");
      card.className = "relic-card";
      if (used) card.classList.add("spent");
      if (!canAfford) card.classList.add("locked");
      card.disabled = used || !canAfford;
      card.innerHTML = `
        <strong>${name}</strong>
        <p>${relic.effect || relic.type || "No effect listed."}</p>
        <div class="relic-meta">
          <span>${relic.type || "Relic"}</span>
          <span>⚡ ${energyCost}</span>
        </div>
        <div class="card-status">${statusText}</div>
      `;
      if (!card.disabled) {
        card.addEventListener("click", () => {
          closeActionModal();
          activateRelicPower(name);
        });
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function activateRelicPower(relicName) {
  const relic = relicCatalog.get(relicName);
  if (!relic) {
    logEvent(`${relicName} has no defined power yet.`);
    return;
  }
  if (!(player.relicsUsedThisTurn instanceof Set)) {
    player.relicsUsedThisTurn = new Set();
  }
  if (player.relicsUsedThisTurn.has(relicName)) {
    logEvent(`${relicName} has already been invoked this turn.`);
    return;
  }
  const energyCost = relic.energyCost ?? 1;
  if (player.energy < energyCost) {
    logEvent("⚡ Not enough energy to awaken that relic.");
    return;
  }
  player.energy -= energyCost;
  player.relicsUsedThisTurn.add(relicName);
  if (typeof relic.logic === "function") {
    relic.logic({
      player,
      logEvent,
    });
    updateDerivedStats();
    renderHUD();
  } else {
    logEvent(`${relicName} glows faintly, but nothing happens.`);
  }
}

function markRelicClaimed(relicName) {
  if (!relicName || relicName === "None") return;
  availableDelveRelics.delete(relicName);
}

function grantRelicToPlayer(relicName, sourceFactionName) {
  if (!relicName) return false;
  if (!player.relics) player.relics = [];
  if (!player.relics.includes(relicName)) {
    player.relics.push(relicName);
  }
  markRelicClaimed(relicName);
  logEvent(`🔮 Acquired ${relicName} from ${sourceFactionName || "mysterious origins"}!`);
  return true;
}

function acquireRelicFromFaction(faction, reason = "battle") {
  if (!faction) return null;
  const relicName = factionRelics.get(faction.name);
  if (!relicName) return null;
  factionRelics.set(faction.name, null);
  grantRelicToPlayer(relicName, `${faction.name} (${reason})`);
  return relicName;
}

function acquireRandomRelic(options = {}) {
  const { reason = "delve", preferredFactions } = options;
  if (reason === "delve") {
    const pool = [...availableDelveRelics];
    if (!pool.length) return null;
    const relicName = pool[Math.floor(Math.random() * pool.length)];
    grantRelicToPlayer(relicName, `${reason}`);
    return relicName;
  }
  let pool = [...factionRelics.entries()].filter(([, relic]) => Boolean(relic));
  if (preferredFactions?.length) {
    const preferred = pool.filter(([owner]) => preferredFactions.includes(owner));
    if (preferred.length) pool = preferred;
  }
  if (!pool.length) return null;
  const [ownerName, relicName] = pool[Math.floor(Math.random() * pool.length)];
  factionRelics.set(ownerName, null);
  grantRelicToPlayer(relicName, `${ownerName} (${reason})`);
  return relicName;
}

function hasAvailableDelveRelics() {
  return availableDelveRelics.size > 0;
}

function attemptRelicCapture(targetFaction) {
  if (!targetFaction) return false;
  const relicName = factionRelics.get(targetFaction.name);
  if (!relicName) {
    logEvent(`${targetFaction.name} has no relic left to seize.`);
    return false;
  }
  if (Math.random() > 0.33) {
    logEvent(`${targetFaction.name} protects ${relicName} this time.`);
    return false;
  }
  acquireRelicFromFaction(targetFaction, "battle victory");
  return true;
}

function attemptPlayerRelicTheft(attackerName, baseChance = 0.35) {
  const owned = (player.relics || []).filter(name => name && name !== "None");
  if (!owned.length) {
    logEvent(`${attackerName} found no relics worth stealing.`);
    return false;
  }
  const shield = player.relicShield || 0;
  const successChance = Math.max(0.05, baseChance - shield * 0.05);
  if (Math.random() > successChance) {
    logEvent(`${attackerName} failed to breach your vaults.`);
    return false;
  }
  const index = Math.floor(Math.random() * owned.length);
  const relicName = owned[index];
  const removalIndex = player.relics.indexOf(relicName);
  if (removalIndex >= 0) {
    player.relics.splice(removalIndex, 1);
  }
  factionRelics.set(attackerName, relicName);
  logEvent(`🕵️ ${attackerName} stole ${relicName} from your vaults!`);
  return true;
}

const aiAggressionTendencies = {
  "The Crimson Horde": 0.7,
  "The Devoured Faith": 0.5,
  "The Jade Empire": 0.2,
  "The Meadowfolk Union": 0.15,
  "The Silken Dominion": 0.4,
  "The Mycelial Monarchy": 0.45,
};

const aiDiplomacyTendencies = {
  "The Crimson Horde": 0.2,
  "The Devoured Faith": 0.25,
  "The Jade Empire": 0.5,
  "The Meadowfolk Union": 0.6,
  "The Silken Dominion": 0.35,
  "The Mycelial Monarchy": 0.3,
};

const aiAbilityEffects = {
  Taxes: state => {
    const levy = Math.min(player.gold, 25 + player.economy);
    player.gold -= levy;
    state.gold = (state.gold || 0) + levy;
    logEvent(`🐉 ${state.faction.name} taxes your caravans for ${levy} gold.`);
  },
  Diplomats: state => {
    if (player.declaredWars.includes(state.faction.name)) {
      player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
      logEvent(`🐉 ${state.faction.name} enforces diplomatic peace and exits the war.`);
    } else {
      player.happiness += 1;
      logEvent(`🐉 ${state.faction.name}'s diplomats soothe tensions, boosting happiness.`);
    }
  },
  Loot: state => {
    const theft = Math.min(player.gold, 15 + Math.round((state.aggression || 0.3) * 30));
    player.gold -= theft;
    state.gold = (state.gold || 0) + theft;
    logEvent(`🐺 ${state.faction.name} loot ${theft} gold from your border towns.`);
  },
  Raid: () => {
    const loss = Math.min(player.troops, 5 + Math.round(player.protection / 2));
    player.troops = Math.max(0, player.troops - loss);
    player.happiness = Math.max(0, player.happiness - 1);
    logEvent(`🐺 Horde raiders cut down ${loss} of your troops and demoralize the people.`);
  },
  Consume: () => {
    const drain = Math.min(player.energy, 2);
    player.energy -= drain;
    logEvent(`🐺 Horde zealots burn your supply lines, draining ${drain} energy.`);
  },
  Delve: state => {
    if (!attemptPlayerRelicTheft(state.faction.name, 0.55)) {
      logEvent(`🕯️ ${state.faction.name} failed to recover a relic from you.`);
    }
  },
  Sanctify: () => {
    const tithe = Math.min(player.gold, 20);
    player.gold -= tithe;
    player.happiness = Math.max(0, player.happiness - 1);
    logEvent(`🕯️ The Devoured Faith sanctifies your markets, seizing ${tithe} gold.`);
  },
  Encamp: () => {
    player.protection = Math.max(0, player.protection - 1);
    logEvent("🕯️ Faith encampments unsettle your border, lowering protection.");
  },
  Infiltration: state => {
    if (!attemptPlayerRelicTheft(state.faction.name, 0.65)) {
      player.gold = Math.max(0, player.gold - 15);
      logEvent(`🕯️ ${state.faction.name} siphons 15 gold through infiltration.`);
    }
  },
  Harmony: () => {
    player.happiness += 1;
    player.protection += 1;
    logEvent("🌾 Meadowfolk harmony radiates outward, lifting spirits and defenses.");
  },
  Cooperation: () => {
    player.harvestedGoods = player.harvestedGoods || {};
    player.harvestedGoods.wheat = (player.harvestedGoods.wheat || 0) + 1;
    logEvent("🌾 Meadowfolk share a crate of wheat with you.");
    recalcHarvestedGoodsValue();
  },
  Regrow: () => {
    player.harvestsLeft = Math.min(player.harvestLimit, (player.harvestsLeft || 0) + 2);
    logEvent("🌾 Meadowfolk regrow your fields, restoring harvest chances.");
  },
  SpinWeb: () => {
    player.tradesRemaining = Math.max(0, (player.tradesRemaining || 0) - 1);
    logEvent("🕷️ Silken Dominion webs delay one of your trade missions.");
  },
  Manipulate: () => {
    player.happiness = Math.max(0, player.happiness - 1);
    logEvent("🕷️ Silken agents spread rumors, dinging happiness.");
  },
  Entangle: () => {
    const energySnare = Math.min(player.energy, 1);
    player.energy -= energySnare;
    logEvent("🕷️ Entangling strands sap a bit of your energy.");
  },
  Spread: () => {
    player.protection = Math.max(0, player.protection - 1);
    logEvent("🍄 Spores spread through your ramparts, weakening protection.");
  },
  Bloom: () => {
    player.happiness = Math.max(0, player.happiness - 1);
    logEvent("🍄 Mycelial blooms unsettle the populace, lowering happiness.");
  },
  Rebirth: () => {
    player.harvestedGoods = player.harvestedGoods || {};
    if (player.harvestedGoods.spore_bloom) {
      player.harvestedGoods.spore_bloom = Math.max(0, player.harvestedGoods.spore_bloom - 1);
    }
    player.energy = Math.max(0, player.energy - 1);
    logEvent("🍄 A spore rebirth consumes supplies, draining a little energy.");
    recalcHarvestedGoodsValue();
  },
};

function initializeAIStates(playerFaction) {
  aiStates.clear();
  factions.forEach(faction => {
    if (faction.name === playerFaction.name) return;
    aiStates.set(faction.name, createAIState(faction));
  });
}

function createAIState(faction) {
  const parse = value => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 3;
  };
  return {
    faction,
    gold: parse(faction.defaultTraits?.economy) * 20 + 100,
    troops: parse(faction.defaultTraits?.prowess) * 10 + 40,
    resilience: parse(faction.defaultTraits?.resilience) + 5,
    aggression: aiAggressionTendencies[faction.name] ?? 0.3,
    diplomacy: aiDiplomacyTendencies[faction.name] ?? 0.3,
  };
}

function processAIFactionTurns() {
  aiStates.forEach(state => executeAIFactionTurn(state));
}

function executeAIFactionTurn(state) {
  const factionName = state.faction.name;
  logEvent(`🤖 It is now ${state.faction.emoji} ${factionName}'s turn.`);
  resolvePendingPeaceFor(state);
  if (player.declaredWars.includes(factionName)) {
    aiWarSkirmish(state);
    return;
  }
  if (!player.alliances.includes(factionName) && Math.random() < state.diplomacy * 0.4) {
    aiRequestAlliance(state);
    return;
  }
  if (Math.random() < state.aggression * 0.5) {
    aiDeclareWarOnPlayer(state);
    return;
  }
  if ((state.faction.abilities || []).length && Math.random() < 0.6) {
    aiUseAbility(state);
  } else {
    aiGatherResources(state);
  }
}

function resolvePendingPeaceFor(state) {
  if (!Array.isArray(player.pendingPeaceOffers)) return;
  const offer = player.pendingPeaceOffers.find(entry => entry.faction === state.faction.name);
  if (!offer) return;
  offer.turnsRemaining -= 1;
  if (offer.turnsRemaining > 0) return;
  const accepted = willFactionAcceptPeace(state.faction);
  if (accepted) {
    player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
    logEvent(`🕊️ ${state.faction.name} accepts your peace proposal.`);
  } else {
    logEvent(`${state.faction.name} rejects your peace envoy.`);
  }
  player.pendingPeaceOffers = player.pendingPeaceOffers.filter(entry => entry !== offer);
}

function aiWarSkirmish(state) {
  const loss = Math.max(1, Math.round((state.troops || 30) / 12));
  player.troops = Math.max(0, player.troops - loss);
  const plunder = Math.min(player.gold, 10 + loss * 2);
  player.gold -= plunder;
  state.gold = (state.gold || 0) + plunder;
  logEvent(
    `${state.faction.emoji} ${state.faction.name} raids your lands, costing ${loss} troops and ${plunder} gold.`
  );
  if (Math.random() < 0.3) {
    attemptPlayerRelicTheft(state.faction.name);
  }
}

function aiRequestAlliance(state) {
  if (player.declaredWars.includes(state.faction.name)) return;
  logEvent(`${state.faction.emoji} ${state.faction.name} requests an alliance.`);
  const acceptChance = 0.5 + (player.happiness > 5 ? 0.15 : 0);
  if (Math.random() < acceptChance) {
    if (!player.alliances.includes(state.faction.name)) {
      player.alliances.push(state.faction.name);
    }
    player.declaredWars = player.declaredWars.filter(name => name !== state.faction.name);
    logEvent(`🤝 You accept the alliance with ${state.faction.name}.`);
  } else {
    logEvent(`❌ You decline ${state.faction.name}'s offer, keeping them at arm's length.`);
  }
}

function aiDeclareWarOnPlayer(state) {
  if (player.declaredWars.includes(state.faction.name)) return;
  player.alliances = player.alliances.filter(name => name !== state.faction.name);
  player.declaredWars.push(state.faction.name);
  logEvent(`⚔️ ${state.faction.name} declares war on you!`);
}

function aiUseAbility(state) {
  const abilities = state.faction.abilities || [];
  if (!abilities.length) {
    aiGatherResources(state);
    return;
  }
  const ability = abilities[Math.floor(Math.random() * abilities.length)];
  applyAIAbilityEffect(state, ability);
}

function applyAIAbilityEffect(state, ability) {
  const fn = aiAbilityEffects[ability.name];
  if (fn) {
    fn(state);
  } else {
    logEvent(`${state.faction.emoji} ${state.faction.name} practices ${ability.name}, plotting silently.`);
  }
}

function aiGatherResources(state) {
  const haul = 10 + Math.floor(Math.random() * 10);
  state.gold = (state.gold || 0) + haul;
  state.troops = (state.troops || 0) + 2;
  logEvent(`${state.faction.emoji} ${state.faction.name} consolidates, earning ${haul} gold.`);
}

/////////////////////////////////////
///  TARGETING & SPOILS HELPERS   ///
/////////////////////////////////////
function chooseOpponent(actionLabel, filterFn = () => true) {
  const others = factions.filter(
    f => f.name !== player.faction.name && filterFn(f)
  );
  if (!others.length) {
    logEvent(`No factions available to ${actionLabel}.`);
    return null;
  }
  const promptMsg = `Select a faction to ${actionLabel}:\n${others
    .map((f, i) => `${i + 1}. ${f.emoji} ${f.name}`)
    .join("\n")}`;
  const choice = prompt(promptMsg);
  if (!choice) {
    logEvent("Selection cancelled.");
    return null;
  }
  const index = parseInt(choice, 10) - 1;
  const selectedFaction = others[index];
  if (!selectedFaction) {
    logEvent("❌ Invalid faction choice.");
    return null;
  }
  return selectedFaction;
}

function grantBattleSpoils(targetFaction, atWar) {
  if (!battleSpoils || !battleSpoils.length) return;
  const spoils = battleSpoils[Math.floor(Math.random() * battleSpoils.length)];
  const multiplier = atWar ? 2 : 1;
  const gains = [];
  const goldGain = (spoils.price || 0) * multiplier;
  if (goldGain) {
    player.gold += goldGain;
    gains.push(`${goldGain} gold`);
  }
  const boosts = spoils.statBoosts || {};
  Object.keys(boosts).forEach(stat => {
    const value = boosts[stat] * multiplier;
    if (!value || typeof player[stat] !== "number") return;
    player[stat] += value;
    gains.push(`${value} ${stat}`);
  });
  const warNote = atWar ? " (war spoils doubled!)" : "";
  const rewardText = gains.length ? gains.join(", ") : "No tangible gains";
  logEvent(`🏴‍☠️ Claimed ${spoils.name}${warNote} against ${targetFaction.name}. ${rewardText}.`);
}

const peacePersonalities = {
  "The Crimson Horde": "hostile",
  "The Devoured Faith": "zealous",
  "The Jade Empire": "pragmatic",
  "The Meadowfolk Union": "peaceful",
  "The Silken Dominion": "schemer",
  "The Mycelial Monarchy": "patient",
};

function willFactionAcceptPeace(faction) {
  const attitude = peacePersonalities[faction.name] || "neutral";
  switch (attitude) {
    case "hostile":
      return false;
    case "peaceful":
      return true;
    case "pragmatic":
      return Math.random() > 0.25;
    case "schemer":
      return Math.random() > 0.55;
    case "zealous":
      return Math.random() > 0.65;
    case "patient":
      return Math.random() > 0.4;
    default:
      return Math.random() > 0.5;
  }
}

/////////////////////////////////////
///      DIPLOMACY MENU LOGIC     ///
/////////////////////////////////////
let diplomacyModal = null;
let diplomacyList = null;
let actionModal = null;
let actionModalTitle = null;
let actionModalBody = null;
function showDiplomacyMenu() {
  if (!diplomacyModal || !diplomacyList) return;
  renderDiplomacyMenu();
  diplomacyModal.classList.add("open");
}
function hideDiplomacyMenu() {
  if (diplomacyModal) {
    diplomacyModal.classList.remove("open");
  }
}
function renderDiplomacyMenu() {
  if (!diplomacyList) return;
  diplomacyList.innerHTML = "";
  const others = factions.filter(f => f.name !== player.faction.name);
  others.forEach(faction => {
    const isAlly = player.alliances.includes(faction.name);
    const atWar = player.declaredWars.includes(faction.name);
    const relation = isAlly ? "🤝 Alliance" : atWar ? "⚔️ At War" : "😐 Neutral";

    const card = document.createElement("div");
    const relationClass = isAlly ? "status-ally" : atWar ? "status-war" : "status-neutral";
    card.className = `diplomacy-faction ${relationClass}`;
    const header = document.createElement("div");
    header.innerHTML = `<strong class="${relationClass}">${faction.emoji} ${faction.name}</strong> — <span class="${relationClass}">${relation}</span>`;
    card.appendChild(header);

    const actions = document.createElement("div");
    actions.className = "diplomacy-actions";

    const allianceBtn = document.createElement("button");
    allianceBtn.innerHTML = isAlly
      ? "Break Alliance"
      : `Offer Alliance <span class="cost-pill">⚡${ALLIANCE_COST.energy} • 💰${ALLIANCE_COST.gold}</span>`;
    allianceBtn.addEventListener("click", () => {
      if (isAlly) {
        breakAlliance(faction);
      } else {
        offerAlliance(faction);
      }
      renderDiplomacyMenu();
    });

    const warBtn = document.createElement("button");
    if (atWar) {
      warBtn.innerHTML = `Offer Peace <span class="cost-pill">⚡${PEACE_COST_ENERGY}</span>`;
      warBtn.addEventListener("click", () => {
        offerPeace(faction);
        renderDiplomacyMenu();
      });
    } else {
      warBtn.innerHTML = `Declare War <span class="cost-pill">⚡${DECLARE_WAR_COST.energy} • 💰${DECLARE_WAR_COST.gold}</span>`;
      warBtn.disabled = isAlly;
      warBtn.title = isAlly ? "Break the alliance first." : "";
      warBtn.addEventListener("click", () => {
        startWarWithFaction(faction);
        renderDiplomacyMenu();
      });
    }

    const loreBtn = document.createElement("button");
    loreBtn.textContent = "📜 Lore";

    const loreBlock = document.createElement("div");
    loreBlock.className = "faction-lore";
    loreBlock.textContent = faction.fullLore || "No lore recorded yet.";
    loreBlock.hidden = true;

    loreBtn.addEventListener("click", () => {
      const isHidden = loreBlock.hasAttribute("hidden");
      if (isHidden) {
        loreBlock.removeAttribute("hidden");
      } else {
        loreBlock.setAttribute("hidden", "hidden");
      }
    });

    actions.appendChild(allianceBtn);
    actions.appendChild(warBtn);
    actions.appendChild(loreBtn);
    card.appendChild(actions);
    card.appendChild(loreBlock);
    diplomacyList.appendChild(card);
  });
}

/////////////////////////////////////
///        ACTION MODAL UI        ///
/////////////////////////////////////
function openActionModal(title, builder) {
  if (!actionModal || !actionModalBody) return;
  actionModal.classList.add("open");
  if (actionModalTitle) {
    actionModalTitle.textContent = title;
  }
  actionModalBody.innerHTML = "";
  if (typeof builder === "function") {
    builder(actionModalBody);
  }
}

function closeActionModal() {
  if (actionModal) {
    actionModal.classList.remove("open");
  }
  if (actionModalBody) {
    actionModalBody.innerHTML = "";
  }
}

function offerAlliance(faction) {
  if (player.alliances.includes(faction.name)) {
    logEvent(`Already allied with ${faction.name}.`);
    return;
  }
  if (player.declaredWars.includes(faction.name)) {
    logEvent(`Cannot ally with ${faction.name} while at war. Offer peace first.`);
    return;
  }
  spendEnergyAndGold(
    ALLIANCE_COST.energy,
    ALLIANCE_COST.gold,
    `🤝 Petitioned ${faction.name} for alliance.`,
    () => {
      const accepted = Math.random() > 0.35;
      if (accepted) {
        player.alliances.push(faction.name);
        logEvent(`🤝 ${faction.name} accepted your alliance offer!`);
      } else {
        logEvent(`${faction.name} declined your request for alliance.`);
      }
    }
  );
}
function breakAlliance(faction) {
  if (!player.alliances.includes(faction.name)) {
    logEvent(`No alliance exists with ${faction.name}.`);
    return;
  }
  player.alliances = player.alliances.filter(name => name !== faction.name);
  logEvent(`❌ Alliance with ${faction.name} has been dissolved.`);
}
function startWarWithFaction(faction) {
  if (player.declaredWars.includes(faction.name)) {
    logEvent(`Already at war with ${faction.name}.`);
    return;
  }
  if (player.alliances.includes(faction.name)) {
    logEvent(`Break your alliance with ${faction.name} before declaring war.`);
    return;
  }
  spendEnergyAndGold(
    DECLARE_WAR_COST.energy,
    DECLARE_WAR_COST.gold,
    `⚔️ Declared war on ${faction.name}! Troops rally to your banner.`,
    () => {
      player.troops += 10;
      player.declaredWars.push(faction.name);
    }
  );
}
function offerPeace(faction) {
  if (!player.declaredWars.includes(faction.name)) {
    logEvent(`You are not currently at war with ${faction.name}.`);
    return;
  }
  const alreadyPending = player.pendingPeaceOffers?.some(entry => entry.faction === faction.name);
  if (alreadyPending) {
    logEvent(`🕊️ A peace envoy is already en route to ${faction.name}.`);
    return;
  }
  spendEnergyAndGold(PEACE_COST_ENERGY, 0, `🕊️ Opened peace talks with ${faction.name}.`, () => {
    if (!Array.isArray(player.pendingPeaceOffers)) player.pendingPeaceOffers = [];
    player.pendingPeaceOffers.push({ faction: faction.name, turnsRemaining: 1 });
    logEvent(`📜 Await ${faction.name}'s response next round.`);
  });
}

/////////////////////////////////////
///         ACTION ROUTER         ///
/////////////////////////////////////
function handleAction(action) {
  switch (action) {
    case "diplomacy":
      showDiplomacyMenu();
      break;
    case "battle": {
      if (player.troops <= 0) {
        logEvent("🪖 Your armies are too depleted to battle.");
        break;
      }
      const availableTargets = factions.filter(
        f => f.name !== player.faction.name && !player.alliances.includes(f.name)
      );
      if (!availableTargets.length) {
        logEvent("All factions are presently allied with you. Break an alliance before battling.");
        break;
      }
      const targetFaction = chooseOpponent("battle", f => !player.alliances.includes(f.name));
      if (!targetFaction) break;
      const atWar = player.declaredWars.includes(targetFaction.name);
      const projectedLoss = Math.max(3, Math.floor(player.troops * 0.15));
      const troopLoss = Math.min(player.troops, projectedLoss);
      spendEnergyAndGold(
        3,
        0,
        `⚔️ Clashed with ${targetFaction.name}. Lost ${troopLoss} troops but gained grit.`,
        () => {
          const mitigation = player.battleBonus || 0;
          player.troops = Math.max(0, player.troops - Math.max(0, troopLoss - mitigation));
          player.protection = Math.max(0, player.protection + 1);
          player.happiness = Math.max(0, player.happiness - 1);
          const captured = attemptRelicCapture(targetFaction);
          if (!captured) {
            grantBattleSpoils(targetFaction, atWar);
          }
        }
      );
      break;
    }
    case "build":
      buildMenu();
      break;
    case "harvest":
      harvestCrops();
      break;
    case "commerce":
      showCommerceModal();
      break;
    case "recruit":
      recruitTroops();
      break;
    case "delve":
      attemptRelicDelve();
      break;
    case "use-relic":
      showRelicMenu();
      break;
    case "inventory":
      showInventoryPanel();
      break;
    case "end-turn":
      endTurn();
      break;
  }
  renderHUD();
}
/////////////////////////////////////
///     ECONOMY & LOG HELPERS     ///
/////////////////////////////////////
function harvestCrops() {
  const limit = player.harvestLimit || 0;
  if (player.harvestsLeft <= 0) {
    logEvent("🌱 The fields need rest. Wait until next turn to harvest again.");
    return;
  }
  const goodsPool = getActiveHarvestGoods();
  if (!goodsPool.length) {
    logEvent("🌾 You have no cultivated goods to harvest yet.");
    return;
  }
  spendEnergyAndGold(HARVEST_ENERGY_COST, 0, null, () => {
    const bounty = goodsPool[Math.floor(Math.random() * goodsPool.length)];
    player.harvestedGoods[bounty.key] = (player.harvestedGoods[bounty.key] || 0) + 1;
    player.harvestsLeft = Math.max(0, player.harvestsLeft - 1);
    recalcHarvestedGoodsValue();
    logEvent(
      `${bounty.emoji} Harvested ${bounty.name}. (${player.harvestsLeft}/${limit} harvests left)`
    );
  });
}

function performTrade(selectedKey, onSuccess) {
  if (player.tradePosts <= 0) {
    logEvent("🏚️ You need a Trading Post before you can export goods.");
    return;
  }
  if (player.tradesRemaining <= 0) {
    logEvent("🚫 All trade missions have been used this turn.");
    return;
  }
  if (!selectedKey) {
    logEvent("❌ Choose goods to export first.");
    return;
  }
  const available = player.harvestedGoods[selectedKey] || 0;
  if (available <= 0) {
    logEvent("🌾 No harvested goods ready for export.");
    return;
  }
  const good = harvestGoodsMap.get(selectedKey);
  if (!good) {
    logEvent("❌ Unknown goods cannot be traded.");
    return;
  }
  const economyMultiplier = Math.max(1, Math.pow(player.economy / 5 + 1, 1.05));
  const tradeStrength = 1 + player.tradePosts * 0.15;
  const goldEarned = Math.round(good.value * economyMultiplier * tradeStrength);
  spendEnergyAndGold(
    COMMERCE_TRADE_COST.energy,
    COMMERCE_TRADE_COST.gold,
    `🚚 Exported ${good.emoji} ${good.name}.`,
    () => {
      player.harvestedGoods[selectedKey] = Math.max(
        0,
        (player.harvestedGoods[selectedKey] || 0) - 1
      );
      player.tradesRemaining = Math.max(0, player.tradesRemaining - 1);
      recalcHarvestedGoodsValue();
      player.gold += goldEarned;
      logEvent(
        `💹 Traders return with ${goldEarned} gold (Economy ×${economyMultiplier.toFixed(
          2
        )}, Posts ×${tradeStrength.toFixed(2)}).`
      );
      if (typeof onSuccess === "function") onSuccess();
      renderHUD();
    }
  );
}

function collectImportCrate(onSuccess) {
  if (player.imports <= 0) {
    logEvent("📭 No imports to collect!");
    return;
  }
  const importItem = importItems[Math.floor(Math.random() * importItems.length)];
  const bonusNames = [];
  const boosts = importItem.statBoosts || {};
  if (boosts.happiness) bonusNames.push(`${boosts.happiness} happiness`);
  if (boosts.protection) bonusNames.push(`${boosts.protection} protection`);
  if (boosts.troops) bonusNames.push(`${boosts.troops} troops`);
  if (boosts.energy) bonusNames.push(`${boosts.energy} energy`);
  const bonusMsg = bonusNames.length ? ` and bonus ${bonusNames.join(", ")}` : "";
  spendEnergyAndGold(
    0,
    0,
    `📥 Collected imported ${importItem.name}! Gained ${importItem.price} gold${bonusMsg}!`,
    () => {
      player.imports = Math.max(0, player.imports - 1);
      if (boosts.happiness) player.happiness += boosts.happiness;
      if (boosts.protection) player.protection += boosts.protection;
      if (boosts.troops) player.troops += boosts.troops;
      if (boosts.energy) player.energy += boosts.energy;
      player.gold += importItem.price;
      if (typeof onSuccess === "function") onSuccess();
      renderHUD();
    }
  );
}

function recruitTroops() {
  const recruits = Math.max(1, player.prowess + (player.recruitBonus || 0));
  spendEnergyAndGold(
    RECRUIT_COST.energy,
    RECRUIT_COST.gold,
    `🪖 Recruited ${recruits} fresh troops.`,
    () => {
      player.troops += recruits;
    }
  );
}

function attemptRelicDelve() {
  if (!hasAvailableDelveRelics()) {
    logEvent("🕳️ There are no undiscovered relics left to delve.");
    return;
  }
  spendEnergyAndGold(
    RELIC_DELVE_COST.energy,
    RELIC_DELVE_COST.gold,
    "🕳️ Crews descend into forgotten ruins...",
    () => {
      const relic = acquireRandomRelic({ reason: "delve" });
      if (relic) {
        logEvent(`🔮 Unearthed ${relic} during the delve!`);
      } else {
        logEvent("🥀 The expedition returned empty-handed.");
      }
      renderHUD();
    }
  );
}

function showInventoryPanel() {
  openActionModal("📦 Inventory Ledger", body => {
    const info = document.createElement("div");
    info.className = "inventory-info";
    info.innerHTML = `
      <div>🚢 Imports waiting: <strong>${player.imports}</strong></div>
      <div>🌾 Harvests left: <strong>${player.harvestsLeft}/${player.harvestLimit || 0}</strong></div>
      <div>📦 Trades left: <strong>${player.tradesRemaining}/${player.tradePosts || 0}</strong></div>
      <div>🛒 Trade Posts: <strong>${player.tradePosts || 0}</strong></div>
    `;
    const goodsGrid = document.createElement("div");
    goodsGrid.className = "inventory-goods";
    getHarvestCatalog().forEach(g => {
      const item = document.createElement("div");
      item.className = "inventory-good";
      item.innerHTML = `<span>${g.emoji}</span>
        <div>
          <strong>${g.name}</strong>
          <small>${(player.harvestedGoods && player.harvestedGoods[g.key]) || 0} crate(s)</small>
        </div>`;
      goodsGrid.appendChild(item);
    });
    body.appendChild(info);
    body.appendChild(goodsGrid);
  });
}

function showCommerceModal() {
  openActionModal("🏛️ Trade & Imports", body => {
    renderCommerceContent(body);
  });
}

function renderCommerceContent(container) {
  container.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "inventory-info commerce-info";
  summary.innerHTML = `
    <div>🛒 Trade Posts: <strong>${player.tradePosts || 0}</strong></div>
    <div>🚚 Trades left: <strong>${player.tradesRemaining}/${player.tradePosts || 0}</strong></div>
    <div>📦 Goods stored: <strong>${getTotalHarvestedGoods()}</strong></div>
    <div>📥 Imports waiting: <strong>${player.imports}</strong></div>
  `;
  container.appendChild(summary);
  if (player.faction && factionHarvestGoods[player.faction.name]) {
    const note = document.createElement("p");
    note.className = "commerce-note";
    const names = factionHarvestGoods[player.faction.name].map(g => g.name).join(", ");
    note.textContent = `${player.faction.emoji} Specialty harvests active: ${names}.`;
    container.appendChild(note);
  }

  const exportsSection = document.createElement("section");
  exportsSection.className = "commerce-section";
  exportsSection.innerHTML = "<h3>Exports</h3>";
  const goodsGrid = document.createElement("div");
  goodsGrid.className = "inventory-goods";
  const economyMultiplier = Math.max(1, Math.pow(player.economy / 5 + 1, 1.05));
  const tradeStrength = 1 + (player.tradePosts || 0) * 0.15;
  getHarvestCatalog().forEach(good => {
    const count = (player.harvestedGoods && player.harvestedGoods[good.key]) || 0;
    const payout = Math.round(good.value * economyMultiplier * tradeStrength);
    const card = document.createElement("div");
    card.className = "inventory-good commerce-good";
    card.innerHTML = `
      <span>${good.emoji}</span>
      <div>
        <strong>${good.name}</strong>
        <small>${count} crate(s)</small>
        <small>≈ ${payout} gold</small>
      </div>
    `;
    const button = document.createElement("button");
    button.textContent = `Send Caravan (⚡${COMMERCE_TRADE_COST.energy})`;
    const disabled =
      player.tradePosts <= 0 ||
      player.tradesRemaining <= 0 ||
      count <= 0 ||
      player.energy < COMMERCE_TRADE_COST.energy;
    button.disabled = disabled;
    button.addEventListener("click", () => performTrade(good.key, () => renderCommerceContent(container)));
    card.appendChild(button);
    goodsGrid.appendChild(card);
  });
  exportsSection.appendChild(goodsGrid);
  if (player.tradePosts <= 0) {
    const note = document.createElement("p");
    note.className = "commerce-note";
    note.textContent = "Build Trading Posts to unlock exports.";
    exportsSection.appendChild(note);
  }
  container.appendChild(exportsSection);

  const importSection = document.createElement("section");
  importSection.className = "commerce-section";
  importSection.innerHTML = "<h3>Imports</h3>";
  const importInfo = document.createElement("p");
  importInfo.textContent = "Collect shipments for gold and random bonuses.";
  importSection.appendChild(importInfo);
  const importBtn = document.createElement("button");
  importBtn.textContent = player.imports > 0 ? `Collect Import (${player.imports} waiting)` : "No imports ready";
  importBtn.disabled = player.imports <= 0;
  importBtn.addEventListener("click", () => collectImportCrate(() => renderCommerceContent(container)));
  importSection.appendChild(importBtn);
  container.appendChild(importSection);
}

function recalcHarvestedGoodsValue() {
  const total = Object.entries(player.harvestedGoods || {}).reduce((sum, [key, count]) => {
    const good = harvestGoodsMap.get(key);
    if (!good) return sum;
    return sum + good.value * count;
  }, 0);
  player.harvestedGoodsValue = total;
}

function getTotalHarvestedGoods() {
  return Object.values(player.harvestedGoods || {}).reduce((sum, count) => sum + count, 0);
}

function formatActionCost(btn) {
  const custom = btn?.dataset?.costCustom;
  if (custom) return custom;
  const energy = Number(btn?.dataset?.costEnergy || 0);
  const gold = Number(btn?.dataset?.costGold || 0);
  const parts = [];
  if (energy) parts.push(`⚡${energy}`);
  if (gold) parts.push(`💰${gold}`);
  return parts.length ? parts.join(" • ") : "Free";
}

function updateActionIndicators() {
  document.querySelectorAll("#actionButtons button").forEach(btn => {
    const actionId = btn.dataset.action;
    const labelEl = btn.querySelector("span");
    const detailEl = btn.querySelector("small");
    if (!detailEl) return;
    if (labelEl?.dataset?.defaultText && !labelEl.textContent) {
      labelEl.textContent = labelEl.dataset.defaultText;
    }
    const costText = `Cost: ${formatActionCost(btn)}`;
    const baseDetail = detailEl.dataset.defaultText || "";
    let detailText = baseDetail ? `${costText} • ${baseDetail}` : costText;
    btn.disabled = false;

    switch (actionId) {
      case "harvest":
        if (labelEl) {
          labelEl.textContent = `🌾 Harvest (${player.harvestsLeft}/${player.harvestLimit || 0})`;
        }
        detailText += ` • Goods stored: ${getTotalHarvestedGoods()}`;
        if (player.harvestsLeft <= 0 || player.energy < HARVEST_ENERGY_COST) {
          btn.disabled = true;
        }
        break;
      case "battle":
        detailText += ` • Troops ready: ${player.troops}`;
        break;
      case "commerce":
        if (labelEl) {
          labelEl.textContent = `🏛️ Commerce (${player.tradesRemaining}/${player.tradePosts || 0})`;
        }
        detailText += ` • Imports waiting: ${player.imports}`;
        if (!player.tradePosts) {
          detailText += " • Build a Trading Post to unlock exports.";
        }
        break;
      case "delve":
        if (labelEl) {
          labelEl.textContent = `🕳️ Delve (${availableDelveRelics.size} unclaimed)`;
        }
        if (!hasAvailableDelveRelics()) {
          btn.disabled = true;
          detailText += " • Vaults exhausted";
        }
        break;
      case "recruit":
        detailText += ` • Gain ${Math.max(1, player.prowess + (player.recruitBonus || 0))} troops`;
        break;
      case "use-relic": {
        const ownedRelics = (player.relics || []).filter(name => name && name !== "None").length;
        detailText += ` • Relics owned: ${ownedRelics}`;
        break;
      }
      case "inventory":
        detailText += ` • Imports: ${player.imports}`;
        break;
      case "end-turn":
        detailText = "Recover energy, refresh harvests and trade missions.";
        break;
      default:
        if (labelEl?.dataset?.defaultText) {
          labelEl.textContent = labelEl.dataset.defaultText;
        }
        break;
    }
    detailEl.textContent = detailText;
  });
}

const BUILD_COST_STEP = 0.2;

function getScaledCost(cost, builtCount) {
  const multiplier = 1 + builtCount * BUILD_COST_STEP;
  return {
    gold: Math.round(cost.gold * multiplier),
    energy: cost.energy,
  };
}

function buildMenu() {
  const available = buildings.filter(b => {
    const factionAllowed =
      b.availableTo === "all" ||
      (Array.isArray(b.availableTo) && b.availableTo.includes(player.faction.name));
    return factionAllowed;
  });

  if (!available.length) {
    logEvent("No buildings available right now.");
    return;
  }

  openActionModal("🏗️ Construct a Building", body => {
    const grid = document.createElement("div");
    grid.className = "build-grid";
    available.forEach(b => {
      const builtCount = player.buildings.filter(item => item === b.name).length;
      const prereqMet = !b.preRec || b.preRec === "none" || player.buildings.includes(b.preRec);
      const scaledCost = getScaledCost(b.cost, builtCount);
      const hasResources = player.gold >= scaledCost.gold && player.energy >= scaledCost.energy;
      const card = document.createElement("button");
      card.className = "build-card";
      if (!prereqMet) {
        card.classList.add("locked");
      } else if (!hasResources) {
        card.classList.add("costly");
      }
      card.disabled = !prereqMet || !hasResources;
      card.innerHTML = `
        <strong>${b.name}</strong>
        <p class="build-desc">${b.description}</p>
        <div class="build-meta">
          <span>💰 ${scaledCost.gold}</span>
          <span>⚡ ${scaledCost.energy}</span>
          <span>🏛️ ${builtCount}</span>
        </div>
        <div class="card-status">
          ${
            !prereqMet
              ? `Requires ${b.preRec}`
              : hasResources
              ? "Ready to build"
              : "Need more resources"
          }
        </div>
      `;
      if (prereqMet && hasResources) {
        card.addEventListener("click", () => {
          closeActionModal();
          purchaseBuilding(b, scaledCost);
        });
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  });
}

function purchaseBuilding(selected, scaledCost) {
  const builtCount = player.buildings.filter(item => item === selected.name).length;
  const cost = scaledCost || getScaledCost(selected.cost, builtCount);
  spendEnergyAndGold(
    cost.energy,
    cost.gold,
    `🏗️ Built ${selected.name}!`,
    () => {
      player.buildings.push(selected.name);
      if (selected.statBoosts?.happiness) player.happiness += selected.statBoosts.happiness;
      if (selected.statBoosts?.protection) player.protection += selected.statBoosts.protection;
      if (selected.statBoosts?.gold) player.gold += selected.statBoosts.gold;
      if (selected.tradeIncome) {
        player.tradePostIncome = (player.tradePostIncome || 0) + selected.tradeIncome;
        logEvent(`📦 Trading Posts now yield +${selected.tradeIncome} gold per turn.`);
      }
      if (selected.economyBonus) {
        player.economyBonus = (player.economyBonus || 0) + selected.economyBonus;
        logEvent("💹 Your economy strengthens thanks to the new trade hub.");
      }
      if (selected.tradeBoost) {
        player.tradePosts = (player.tradePosts || 0) + 1;
        player.tradesRemaining = Math.min(
          player.tradePosts,
          (player.tradesRemaining || 0) + 1
        );
        logEvent(`🛒 Trade missions per turn increased to ${player.tradePosts}.`);
      }
      if (selected.harvestBonus) {
        player.harvestLimit = (player.harvestLimit || 0) + selected.harvestBonus;
        player.harvestsLeft = Math.min(player.harvestLimit, (player.harvestsLeft || 0) + selected.harvestBonus);
        logEvent(`🌾 Harvest opportunities increased to ${player.harvestLimit} per turn.`);
      }
      if (selected.energyBonus) {
        player.energyBonus = (player.energyBonus || 0) + selected.energyBonus;
        logEvent("⚡ Spiritual engines hum louder. Energy recovery improves.");
      }
      if (selected.recruitBonus) {
        player.recruitBonus = (player.recruitBonus || 0) + selected.recruitBonus;
      }
      if (selected.battleBonus) {
        player.battleBonus = (player.battleBonus || 0) + selected.battleBonus;
      }
      if (selected.extraGoods?.length) {
        registerHarvestGoods(selected.extraGoods);
        if (!player.extraHarvestGoods) player.extraHarvestGoods = [];
        player.extraHarvestGoods.push(...selected.extraGoods);
        logEvent("🧺 New specialty goods can now be harvested.");
      }
      if (selected.unlocksAbilityTag) {
        if (!player.unlockedAbilityTags) player.unlockedAbilityTags = new Set();
        player.unlockedAbilityTags.add(selected.unlocksAbilityTag);
      }
      if (selected.relicShield) {
        player.relicShield = (player.relicShield || 0) + 1;
      }
      renderHUD();
    }
  );
}
function spendEnergyAndGold(energyCost, goldCost, msg, onSuccess) {
  if (player.energy < energyCost) {
    logEvent("⚡ Not enough energy!");
    return false;
  }
  if (player.gold < goldCost) {
    logEvent("💰 Not enough gold!");
    return false;
  }
  player.energy -= energyCost;
  player.gold -= goldCost;
  if (msg) {
    logEvent(msg);
  }
  if (onSuccess) {
    onSuccess();
  }
  return true;
}
function logEvent(msg) {
  const log = document.getElementById("event-log");
  const entry = document.createElement("p");
  entry.textContent = msg;
  entry.classList.add("log-entry");
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
function endTurn() {
  const restored = calcStartingEnergy(player) + (player.energyBonus || 0);
  player.energy += restored;
  logEvent(`🌙 Turn ended. Recovered ${restored} energy (total ${player.energy}).`);
  if (player.tradePostIncome) {
    player.gold += player.tradePostIncome;
    logEvent(`📦 Trading Posts delivered ${player.tradePostIncome} gold.`);
  }
  if (player.relicsUsedThisTurn?.clear) {
    player.relicsUsedThisTurn.clear();
  } else {
    player.relicsUsedThisTurn = new Set();
  }
  if (player.abilitiesUsedThisTurn?.clear) {
    player.abilitiesUsedThisTurn.clear();
  } else {
    player.abilitiesUsedThisTurn = new Map();
  }
  player.harvestsLeft = player.harvestLimit || 0;
  player.tradesRemaining = player.tradePosts || 0;
  player.imports = Math.floor(Math.random() * 5) + 1;
  processAIFactionTurns();
  renderHUD();
}

/////////////////////////////////////
///// PLAYER STATE & INIT /////
/////////////////////////////////////
let player = {
  faction: null,
  energy: 0,
  gold: 0,
  troops: 0,
  happiness: 0,
  protection: 0,
  prowess: 0,
  resilience: 0,
  economy: 1,
  imports: 0,
  relics: [],
  buildings: [],
  declaredWars: [],
  alliances: [],
  tradePostIncome: 0,
  economyBonus: 0,
  relicsUsedThisTurn: new Set(),
  abilitiesUsedThisTurn: new Map(),
  harvestsLeft: 0,
  harvestLimit: 0,
  harvestedGoods: {},
  harvestedGoodsValue: 0,
  tradePosts: 0,
  tradesRemaining: 0,
  extraHarvestGoods: [],
  recruitBonus: 0,
  energyBonus: 0,
  battleBonus: 0,
  relicShield: 0,
  pendingPeaceOffers: [],
  unlockedAbilityTags: new Set(),
};
document.addEventListener("DOMContentLoaded", () => {
  diplomacyModal = document.getElementById("diplomacyModal");
  diplomacyList = document.getElementById("diplomacyList");
  const closeBtn = document.getElementById("closeDiplomacy");
  if (closeBtn) {
    closeBtn.addEventListener("click", hideDiplomacyMenu);
  }
  if (diplomacyModal) {
    diplomacyModal.addEventListener("click", event => {
      if (event.target === diplomacyModal) hideDiplomacyMenu();
    });
  }
  actionModal = document.getElementById("actionModal");
  actionModalTitle = document.getElementById("actionModalTitle");
  actionModalBody = document.getElementById("actionModalBody");
  const closeActionBtn = document.getElementById("closeActionModal");
  if (closeActionBtn) {
    closeActionBtn.addEventListener("click", closeActionModal);
  }
  if (actionModal) {
    actionModal.addEventListener("click", event => {
      if (event.target === actionModal) {
        closeActionModal();
      }
    });
  }
  const chosen = localStorage.getItem("chosenFaction") || factions[0].name;
  const faction = factions.find(f => f.name === chosen) || factions[0];
  startGame(faction);
}); 
function startGame(faction) {
  startPlayerGame({
    player,
    faction,
    updateDerivedStats,
    renderHUD,
    logEvent,
    handleAction,
    renderFactionAbilities,
  });
  markRelicClaimed(faction.startingRelic);
  factionRelics.set(faction.name, null);
  player.pendingPeaceOffers = [];
  player.extraHarvestGoods = [];
  initializeAIStates(faction);
}
