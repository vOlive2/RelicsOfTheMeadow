export const battleSpoils = [
  /////////////////
  //    TROOPS   //
  /////////////////
  {
    name: "Captured Arms",
    price: 0,
    statBoosts: { troops: 5, protection: 1 },
  },
  {
    name: "Drafted Prisoners",
    price: 0,
    statBoosts: { troops: 8 },
  },
  {
    name: "Siege Blueprints",
    price: 0,
    statBoosts: { protection: 2 },
  },
  /////////////////
  //   SUPPLIES  //
  /////////////////
  {
    name: "Enemy Provisions",
    price: 20,
    statBoosts: { energy: 4 },
  },
  {
    name: "Field Repairs Kit",
    price: 0,
    statBoosts: { protection: 1 },
  },
  /////////////////
  //     GOLD    //
  /////////////////
  {
    name: "Spare Coins",
    price: 10,
    statBoosts: {},
  },
  {
    name: "Seized Tribute",
    price: 35,
    statBoosts: {},
  },
  {
    name: "War Chest",
    price: 50,
    statBoosts: {},
  },
];

console.log("✅ Battle spoils are loaded", battleSpoils);
