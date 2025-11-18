/////////////////////////////////////
/// MODULE IMPORTS               ///
/////////////////////////////////////
import { addResource } from "./resourceManager.js";

/////////////////////////////////////
/// STATE                         ///
/////////////////////////////////////
let lastEncounter = null;

/////////////////////////////////////
/// HELPERS                       ///
/////////////////////////////////////
function grantSpoils(beast, announce) {
  const rewards = {};
  const oreReward = beast.strength * 2;
  const rareReward = beast.strength >= 5 ? beast.strength : 0;
  if (oreReward) rewards.ores = oreReward;
  if (rareReward) rewards.rareMetals = Math.round(rareReward / 2);
  if (beast.type?.includes("Leviathan")) {
    rewards.magicalEssence = 2;
  }
  Object.entries(rewards).forEach(([key, amount]) => addResource(key, amount));
  announce(
    `💎 Spoils recovered: ${Object.entries(rewards)
      .map(([key, amount]) => `${amount} ${key}`)
      .join(", ")}.`
  );
  return rewards;
}

/////////////////////////////////////
/// API                           ///
/////////////////////////////////////
export function resetCombatState() {
  lastEncounter = null;
}

export function getLastEncounter() {
  return lastEncounter;
}

export function resolveBeastEncounter({ player, clearing, beast, announce }) {
  if (!player || !clearing || !beast) {
    return { victory: false, error: "No beast to confront." };
  }
  const troopPower = Math.max(1, player.troops) + (player.battleBonus || 0) * 2;
  const beastPower = (beast.strength || 3) * 12;
  const roll = Math.random() * (troopPower + beastPower);
  const victory = roll > beastPower;
  const casualtyFactor = victory ? 0.15 : 0.35;
  const casualties = Math.max(1, Math.round(player.troops * casualtyFactor));
  player.troops = Math.max(0, player.troops - casualties);
  let rewards = null;
  if (victory) {
    announce(`⚔️ ${beast.type || "Beast"} defeated near clearing #${clearing.id}! Lost ${casualties} troops.`);
    rewards = grantSpoils(beast, announce);
  } else {
    announce(
      `💀 ${beast.type || "Beast"} repelled your forces at clearing #${clearing.id}. Lost ${casualties} troops.`
    );
  }
  lastEncounter = {
    clearingId: clearing.id,
    beast: { ...beast },
    victory,
    casualties,
    rewards,
  };
  return { victory, casualties, rewards };
}
