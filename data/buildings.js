const buildings = [
  {
    name: "Townhouse",
    preRec: "none",
    type: "town",
    description: "A cozy starter home that builds happiness.",
    cost: { gold: 150, energy: 5 },
    statBoosts: { happiness: 1, gold: 25 },
    availableTo: "all"
  },
  {
    name: "Villa",
    preRec: "Townhouse",
    type: "town",
    description: "A refined estate that attracts prosperity.",
    cost: { gold: 265, energy: 10 },
    statBoosts: { happiness: 2, protection: 1, gold: 50 },
    availableTo: "all"
  },
  {
    name: "Humble Mansion",
    preRec: "Villa",
    type: "town",
    description: "A big house for big vibes and bigger taxes.",
    cost: { gold: 465, energy: 20 },
    statBoosts: { happiness: 3, protection: 2, gold: 100 },
    availableTo: "all"
  },
  {
    name: "Manor",
    preRec: "Humble Mansion",
    type: "town",
    description: "An aristocratic estate that rules the suburbia.",
    cost: { gold: 815, energy: 30 },
    statBoosts: { happiness: 4, protection: 3, gold: 200 },
    availableTo: "all"
  },
  {
    name: "Citadel",
    type: "faction",
    description: "Massive fortress unique to The Devoured Faith.",
    cost: { gold: 1000, energy: 40 },
    statBoosts: { protection: 5 },
    availableTo: ["The Devoured Faith"]
  },
  {
    name: "Trading Post",
    type: "trade",
    description: "Generates passive gold and unlocks extra trade actions.",
    cost: { gold: 400, energy: 20 },
    statBoosts: { gold: 50 },
    tradeIncome: 25,
    economyBonus: 1,
    tradeBoost: true,
    availableTo: "all"
  },
  {
    name: "Farm",
    preRec: "none",
    type: "harvest",
    description: "Basic tilled fields that finally let you reap the land.",
    cost: { gold: 180, energy: 5 },
    harvestBonus: 3,
    availableTo: "all"
  },
  {
    name: "Orchard",
    preRec: "Farm",
    type: "harvest",
    description: "Cultivated groves that provide reliable harvest cycles.",
    cost: { gold: 320, energy: 10 },
    harvestBonus: 4,
    energyBonus: 1,
    extraGoods: [
      { key: "orchard_ambrosia", name: "Ambrosia Fruit", emoji: "🍎", value: 32, weight: 2 },
      { key: "orchard_spice", name: "Amber Spice", emoji: "🧂", value: 30, weight: 2 }
    ],
    availableTo: "all"
  },
  {
    name: "Garden of the Gods",
    preRec: "Orchard",
    type: "harvest",
    description: "Mythic gardens tended by spirits, overflowing with bounty.",
    cost: { gold: 650, energy: 18 },
    harvestBonus: 5,
    energyBonus: 1,
    extraGoods: [
      { key: "celestial_blossom", name: "Celestial Blossom", emoji: "🌸", value: 40, weight: 3 },
      { key: "nectar_of_legends", name: "Nectar of Legends", emoji: "🏺", value: 46, weight: 3 }
    ],
    availableTo: "all"
  },
  {
    name: "Vault",
    preRec: "none",
    type: "defense",
    description: "Secure chambers to hide treasures and relics.",
    cost: { gold: 350, energy: 8 },
    statBoosts: { protection: 2 },
    availableTo: "all"
  },
  {
    name: "Super Vault",
    preRec: "Vault",
    type: "defense",
    description: "A labyrinth of traps and steel for your prized relics.",
    cost: { gold: 700, energy: 16 },
    statBoosts: { protection: 4 },
    relicShield: true,
    availableTo: "all"
  },
  {
    name: "Stronghold",
    type: "faction",
    preRec: "none",
    description: "Horde-only bastion that churns out fanatics.",
    cost: { gold: 500, energy: 15 },
    recruitBonus: 2,
    battleBonus: 1,
    availableTo: ["The Crimson Horde"]
  },
  {
    name: "Web Outposts",
    type: "faction",
    preRec: "none",
    description: "Early silken lookout posts that gather tribute.",
    cost: { gold: 420, energy: 12 },
    recruitBonus: 1,
    tradeIncome: 15,
    availableTo: ["The Silken Dominion"]
  },
  {
    name: "Web Stations",
    type: "faction",
    preRec: "Web Outposts",
    description: "Fully woven stations that tax every traveler.",
    cost: { gold: 620, energy: 18 },
    recruitBonus: 2,
    tradeIncome: 25,
    availableTo: ["The Silken Dominion"]
  },
  {
    name: "Spinster's Hut",
    type: "faction",
    preRec: "none",
    description: "Home to the first royal spinners, teaching rare weaving.",
    cost: { gold: 320, energy: 9 },
    extraGoods: [{ key: "web_bundle", name: "Web Bundle", emoji: "🕸️", value: 26 }],
    unlocksAbilityTag: "spinster",
    availableTo: ["The Silken Dominion"]
  },
  {
    name: "Spinster's Mansion",
    type: "faction",
    preRec: "Spinster's Hut",
    description: "An opulent guild that floods the markets with silk.",
    cost: { gold: 540, energy: 14 },
    extraGoods: [
      { key: "web_bundle", name: "Web Bundle", emoji: "🕸️", value: 26 },
      { key: "royal_silk", name: "Royal Silk", emoji: "🕷️", value: 34 }
    ],
    unlocksAbilityTag: "spinster",
    availableTo: ["The Silken Dominion"]
  },
  {
    name: "Base of Operations",
    type: "faction",
    preRec: "none",
    description: "Union command post that floods the land with planners.",
    cost: { gold: 380, energy: 10 },
    energyBonus: 1,
    harvestBonus: 1,
    availableTo: ["The Meadowfolk Union"]
  },
  {
    name: "Spore Field",
    type: "faction",
    preRec: "none",
    description: "Cultivated fungal acres ready to spread spores.",
    cost: { gold: 410, energy: 12 },
    extraGoods: [{ key: "spore_pod", name: "Spore Pod", emoji: "🍄", value: 28 }],
    unlocksAbilityTag: "spores",
    availableTo: ["The Mycelial Monarchy"]
  },
  {
    name: "Nest",
    type: "faction",
    preRec: "none",
    description: "First royal nursery for the Monarchy's hive mind.",
    cost: { gold: 360, energy: 10 },
    recruitBonus: 1,
    statBoosts: { protection: 1 },
    availableTo: ["The Mycelial Monarchy"]
  },
  {
    name: "Hive",
    type: "faction",
    preRec: "Nest",
    description: "Interwoven fungal hive that shields and grows.",
    cost: { gold: 620, energy: 16 },
    recruitBonus: 2,
    statBoosts: { protection: 2 },
    availableTo: ["The Mycelial Monarchy"]
  },
  {
    name: "Mega Hive",
    type: "faction",
    preRec: "Hive",
    description: "An enormous living fortress pulsing with spores.",
    cost: { gold: 900, energy: 22 },
    recruitBonus: 3,
    statBoosts: { protection: 4 },
    battleBonus: 1,
    availableTo: ["The Mycelial Monarchy"]
  }
];

export default buildings;
