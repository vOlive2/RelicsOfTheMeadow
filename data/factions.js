// Faction Data for Relics of the Meadow 🌿

export const factions = [
// === The Crimson Horde ===
  {
    name: "The Crimson Horde",
    emoji: "🐺",
    overview: "Where they march, the ground remembers blood.",
    fullLore:
      "The Crimson Horde are conquerors driven by vengeance. Formed from the broken remnants of empires lost to betrayal, they rise as one under banners of fury. Their unity is born not of loyalty, but of wrath—a singular purpose to reclaim and avenge what was taken from them. Once forgotten, they are now the nightmare the six great powers hoped never to remember.\n\nIn gameplay, the Horde excels in overwhelming assault and vengeance-based mechanics. When one of their settlements falls, their power surges in response, turning loss into momentum, burning everything to reclaim their pride.",
    abilities: [
      { name: "Loot", desc: "For each clearing with only your units, place new units equal to your vengeance points.", cost: 0 },
      { name: "Raid", desc: "Move and battle twice in a clearing, spending 1 vengeance point each time.", cost: 0 },
      { name: "Consume", desc: "Remove one of your units and increase vengeance meter by 1 (cannot exceed current cap).", cost: 0 },
    ],
    startingRelic: "🩸 Horn of Fury",
    defaultTraits: { prowess: "9/10", resilience: "2/10", economy: "4/10" },
    relationships: {
      "Devoured Faith": "neutral",
      "Silken Dominion": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelial Monarchy": "neutral",
      "Crimson Horde": "self",
    },
    flag: "",
    palette: ["#8B0000", "#4B4B4B", "#000000"],
  },

// === The Devoured Faith ===
  {
    name: "The Devoured Faith",
    emoji: "🕯️",
    overview: "They worship what devours them. They kneel to the hunger they cannot escape.",
    fullLore:
      "When the Horde’s wrath scorched the land, not all who survived clung to vengeance. Some sought meaning in ruin—and found it in the dark mouths of what came next. The Devoured Faith was born from desperation, a cult that turned surrender into sanctity. They believe the world’s decay is divine and that to be consumed—by plague, by war, by the gods themselves—is to achieve purity.\n\nThe Faith thrives beneath cathedrals of bone and fungus, their hymns echoing in caverns carved by hunger. They trade in despair, offering salvation through sacrifice and control through devotion. Their priests wield relics and rot alike, scavenging from what others leave behind. Rather than wage open war, they drift in after destruction, harvesting whatever remains—land, relics, or lives. Their rituals are quiet and unsettling, transforming ruin into resource.\n\nIn gameplay, they alone can steal relics from other factions, feeding their power through theft and devotion. They earn points by scavenging relics and resources from abandoned or devastated regions, turning desolation into strength. Though their rituals may appear ominous, the Faith are not destroyers—they are the quiet cleanup crew of the fallen world, inheritors of what others abandon. Their obsession with relics, however, corrodes their surroundings, slowly draining their resilience as their faith’s hunger spreads across the land.",
    abilities: [
      { name: "Delve", desc: "For each relic you own, place one unit in any clearing or move it to your trade track. If overpopulated, move relic to trade track instead.", cost: 0 },
      { name: "Sanctify", desc: "Steal a relic from an enemy unit (max 3 times per turn).", cost: 25 },
      { name: "Encamp", desc: "Place a citadel in any clearing with your pieces.", cost: 20 },
      { name: "Infiltration", desc: "For each sold relic, place a warrior in a clearing with the buyer’s pieces. Remove a citadel each time; cannot activate if none remain.", cost: 0 },
    ],
    startingRelic: "🕯️ Chalice of Ash",
    defaultTraits: { prowess: "6/10", resilience: "6/10", economy: "3/10" },
    relationships: {
      "Devoured Faith": "self",
      "Silken Dominion": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelial Monarchy": "neutral",
      "Crimson Horde": "neutral",
    },
    flag: "",
    palette: ["#0F1417", "#C9B037", "#004E59"],
  },

// === The Jade Empire ===
  {
    name: "The Jade Empire",
    emoji: "🐉",
    overview: "Gold flows like a river—and that’s exactly where the Jade Empire sits.",
    fullLore:
      "The Jade Empire thrives on the pulse of trade. To them, profit is not merely power—it is survival. Built upon centuries of mercantile mastery, they dominate diplomacy and commerce alike, holding the world’s economies in their emerald grasp. The frogs, doves, and cranes each serve a distinct role: the frogs are merchants and politicians, the doves handle diplomacy, and the few remaining cranes work as mercenaries protecting the markets.\n\nTheir empire values wealth above all else. If exile promises gold, they will gladly sell peace to the highest bidder. Other factions rely heavily on their networks; should the Jade Empire cut trade with one, others soon follow. This interwoven reliance ensures their control—starvation of supply and alliance alike.\n\nIn gameplay, they dictate trade and diplomacy. The Jade Empire can impose embargoes, grant favor, or manipulate trade to raise or ruin economies. They earn wealth through transactions and alliances, making every move at the table flow through them. Yet their greed makes them vulnerable—should their trade web collapse, so too does their influence.",
    abilities: [
      { name: "Taxes", desc: "Gain gold from other players’ capitals if you have a trade route with them.", cost: 0 },
      { name: "Diplomats", desc: "Once every 3 turns, overrule or abolish an alliance, or create one, forcing peace.", cost: 30 },
    ],
    startingRelic: "🐉 Coin of Currents",
    defaultTraits: { prowess: "3/10", resilience: "4/10", economy: "8/10" },
    relationships: {
      "Devoured Faith": "neutral",
      "Silken Dominion": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "self",
      "Mycelial Monarchy": "neutral",
      "Crimson Horde": "neutral",
    },
    flag: "",
    palette: ["#00FF7F", "#20B2AA", "#FFFFFF"],
  },

// === The Meadowfolk Union ===
  {
    name: "The Meadowfolk Union",
    emoji: "🐾",
    overview: "The grass remembers every step, and the earth rises to meet its keepers.",
    fullLore:
      "The Meadowfolk Union are builders, tenders, and dreamers. They thrive on harmony between land and life, weaving a civilization from roots and sunlight. Once scattered across open plains, the Meadowfolk united to resist conquest—not through might, but through unity and patience. They measure time in harvests, not wars, and see prosperity as something cultivated, not taken.\n\nIn gameplay, the Union excels in synergy and growth. They gain strength from cooperation—units that stand together become stronger, and clearings left in peace reward them richly. Their structures and trade routes bloom faster when left undisturbed, turning stability into power. They represent the patient hand of creation in a world obsessed with destruction.",
    abilities: [
      { name: "Harmony", desc: "Gain +1 resilience for each undisturbed clearing you rule.", cost: 0 },
      { name: "Cooperation", desc: "If two or more friendly units are adjacent, they generate +1 shared economy.", cost: 0 },
      { name: "Regrow", desc: "Regrow 1 destroyed structure if adjacent to a thriving meadow.", cost: 10 },
    ],
    startingRelic: "🌾 Heart of Spring",
    defaultTraits: { prowess: "4/10", resilience: "7/10", economy: "5/10" },
    relationships: {
      "Devoured Faith": "neutral",
      "Silken Dominion": "neutral",
      "Meadowfolk Union": "self",
      "Jade Empire": "neutral",
      "Mycelial Monarchy": "neutral",
      "Crimson Horde": "neutral",
    },
    flag: "",
    palette: ["#4CAF50", "#FFD700", "#87CEEB"],
  },

// === The Silken Dominion ===
  {
    name: "The Silken Dominion",
    emoji: "🕷️",
    overview: "They whisper from the walls, and their webs glisten with secrets and lies.",
    fullLore:
      "Hidden beneath layers of silk and intrigue, the Silken Dominion spins control through manipulation. Where others wage wars with armies, they fight with whispers, contracts, and poisoned promises. Their society is ruled by spider nobles, each vying for influence, spinning webs that bind lesser creatures into servitude or debt. To outsiders, they appear fragmented—yet every web leads back to the throne.\n\nIn gameplay, the Silken Dominion specialize in subterfuge. They drain enemies slowly, stealing resources and corrupting trade. They gain power from the spread of webs across the map, strangling rival economies in the name of the Spider Court. The more territory they weave, the more they entrap the world.",
    abilities: [
      { name: "SpinWeb", desc: "Gain +1 trade good per webbed settlement you control.", cost: 0 },
      { name: "Manipulate", desc: "Each rival faction adjacent to your web loses 1 economy this turn.", cost: 15 },
      { name: "Entangle", desc: "If an enemy unit ends last turn inside your web, steal 1 of their imports.", cost: 0 },
    ],
    startingRelic: "🕸️ Spinner’s Veil",
    defaultTraits: { prowess: "3/10", resilience: "6/10", economy: "6/10" },
    relationships: {
      "Devoured Faith": "neutral",
      "Silken Dominion": "self",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelial Monarchy": "neutral",
      "Crimson Horde": "neutral",
    },
    flag: "",
    palette: ["#3B0A45", "#9C27B0", "#C0C0C0"],
  },

// === The Mycelial Monarchy ===
  {
    name: "The Mycelial Monarchy",
    emoji: "🍄",
    overview: "When the old world rots, the new one grows from beneath.",
    fullLore:
      "The Mycelial Monarchy thrives in darkness, spreading unseen through decay and ruin. Born from the fusion of fungus and flesh, their society sees death not as an end, but as fertile ground for renewal. Their rulers, the Sporelords, guide the growth of vast fungal networks that reclaim the fallen world—digesting what once was to fuel what will be.\n\nIn gameplay, they expand relentlessly, spreading spore fields that bolster their resilience and spawn new forces. Where they spread, others falter; poison and rebirth go hand in hand. The Monarchy grows through attrition, favoring endurance and inevitability over direct conquest.",
    abilities: [
      { name: "Spread", desc: "At the start of each turn, spread one new spore field to an adjacent clearing.", cost: 0 },
      { name: "Bloom", desc: "Gain +1 resilience per spore field connected to your capital.", cost: 0 },
      { name: "Rebirth", desc: "If an enemy unit was defeated in a spore field last turn, spawn a Sporeling there.", cost: 0 },
    ],
    startingRelic: "🍄 Crown of Spores",
    defaultTraits: { prowess: "5/10", resilience: "8/10", economy: "3/10" },
    relationships: {
      "Devoured Faith": "neutral",
      "Silken Dominion": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelial Monarchy": "self",
      "Crimson Horde": "neutral",
    },
    flag: "",
    palette: ["#3C1E1E", "#6A994E", "#C9CBA3"],
  },
];

console.log("✅ Factions loaded:", factions);
