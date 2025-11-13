export function calculateResilience(player) {
  const total = Math.floor((player.happiness + player.protection)/(player.prowess/2));
  return Math.min(10, total);
}

export function calculateEconomy(gold) {
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
  const rawProwess = Math.floor(player.troops / 20)+(player.protection / 20); // sample formula
  return Math.min(10, rawProwess);
}
