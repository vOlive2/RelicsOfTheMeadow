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
  }
];

export default buildings;
