export const seasonalEvents = [
  {
    key: "rainstorm",
    name: "Rainstorm",
    duration: 2,
    description: "Boosts wheat and herb output across your realm.",
    effects: {
      resourceMultipliers: { wheat: 1.5, herbs: 1.5 },
      happinessShift: 1,
    },
  },
  {
    key: "harvestMoon",
    name: "Harvest Moon",
    duration: 3,
    description: "All production buildings thrum with extra life.",
    effects: {
      productionMultiplier: 1.25,
      happinessShift: 2,
    },
  },
  {
    key: "bountifulCharm",
    name: "Bountiful Charm",
    duration: 2,
    description: "Fruit trees and logging camps flourish.",
    effects: {
      resourceMultipliers: { fruits: 1.6, logs: 1.4 },
    },
  },
];

export const festivalDefinition = {
  key: "meadowFestival",
  name: "Meadow Festival",
  duration: 2,
  description: "A kingdom-wide celebration that lifts spirits and inspires extra work.",
  effects: {
    productionMultiplier: 1.15,
    happinessShift: 6,
  },
};
