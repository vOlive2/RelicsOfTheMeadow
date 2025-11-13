export function calculateResilience(player) {
  const total = player.happiness + player.protection;
  return Math.min(10, total);
}

export function calculateEconomy(gold) {
  if (gold < 50) return 1;
  if (gold < 150) return 2;
  if (gold < 300) return 3;
  if (gold < 600) return 4;
  if (gold < 1200) return 5;
  if (gold < 2500) return 6;
  if (gold < 4200) return 7;
  if (gold < 6000) return 8;
  if (gold < 7500) return 9;
  return 10;
}

export function calculateProwess(player) {
  const rawProwess = Math.floor(player.troops / 10); // sample formula
  return Math.min(10, rawProwess);
}
