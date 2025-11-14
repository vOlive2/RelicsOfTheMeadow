export function calculateResilience(player) {
  const total = Math.floor((player.happiness + player.protection)/(player.prowess/2));
  return Math.min(10, total);
}

export function calculateEconomy(player) {
  const tradeValue = (player.tradePostIncome || 0) * 5;
  const economyBonus = (player.economyBonus || 0) * 50;
  let gold = player.gold + tradeValue + economyBonus;
  if (gold < 10) return 1;
  if (gold < 25) return 2;
  if (gold < 100) return 3;
  if (gold < 250) return 4;
  if (gold < 500) return 5;
  if (gold < 1000) return 6;
  if (gold < 2500) return 7;
  if (gold < 5000) return 8;
  if (gold < 10000) return 9;
  return 10;
}

export function calculateProwess(player) {
  const rawProwess = Math.floor((player.troops / 15)+(player.protection / 15)); // sample formula
  return Math.min(10, rawProwess);
}

function resolveStat(subject, statName) {
  const direct = subject?.[statName];
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  if (typeof direct === "string") {
    const parsedDirect = parseInt(direct, 10);
    if (!Number.isNaN(parsedDirect)) return parsedDirect;
  }

  const defaults = subject?.defaultTraits || subject?.faction?.defaultTraits;
  if (defaults) {
    const fallback = defaults[statName];
    if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
    if (typeof fallback === "string") {
      const parsedFallback = parseInt(fallback, 10);
      if (!Number.isNaN(parsedFallback)) return parsedFallback;
    }
  }
  return 0;
}

export function calcStartingEnergy(subject) {
  const total = ["prowess", "resilience", "economy"].reduce(
    (sum, stat) => sum + resolveStat(subject, stat),
    0
  );
  const avg = total / 2;
  return Math.max(1, Math.ceil(avg));
}
