// Faction Data for Relics of the Meadow 🌿
// (Combined from individual JSONs for GitHub Pages)

const factions = [
  {
    name: "The Crimson Horde",
    emoji: "🐺",
    overview: "Where they march, the ground remembers blood.",
    fullLore:
      "The Crimson Horde are conquerors driven by vengeance. Formed from the broken remnants of empires lost to betrayal, they rise as one under banners of fury. Their unity is born not of loyalty, but of wrath—a singular purpose to reclaim and avenge what was taken from them. Once forgotten, they are now the nightmare the six great powers hoped never to remember.\n\nIn gameplay, the Horde excels in overwhelming assault and vengeance-based mechanics. When one of their settlements falls, their power surges in response, turning loss into momentum. They are at their strongest when cornered, burning everything to reclaim their pride.",
    specialMechanic: {},
    startingRelic: "🩸 Horn of Fury",
    defaultTraits: { prowess: 7, resilience: 2, economy: 3 },
    relationships: {
      "Devoured Faith": "neutral",
      "Spider Court": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelid Monarchy": "neutral",
      "Crimson Horde": "self"
    },
    flag: "",
    palette: ["#8B0000", "#4B4B4B", "#000000"]
  },
  {
    name: "The Devoured Faith",
    emoji: "🕯️",
    overview: "They worship what devours them. They kneel to the hunger they cannot escape.",
    fullLore:
      "When the Horde’s wrath scorched the land, not all who survived clung to vengeance. Some sought meaning in ruin—and found it in the dark mouths of what came next. The Devoured Faith was born from desperation, a cult that turned surrender into sanctity. They believe the world’s decay is divine and that to be consumed—by plague, by war, by the gods themselves—is to achieve purity.\n\nThe Faith thrives beneath cathedrals of bone and fungus, their hymns echoing in caverns carved by hunger. They trade in despair, offering salvation through sacrifice and control through devotion. Their priests wield relics and rot alike, scavenging from what others leave behind. Rather than wage open war, they drift in after destruction, harvesting whatever remains—land, relics, or lives. Their rituals are quiet and unsettling, transforming ruin into resource.\n\nUnlike structured nations, the Faith has no stable government—only belief. Their leaders, chosen from a set of ever-shifting prophets, rise and fall in constant cycles of ascension, arrest, and replacement. Each one brings new doctrine, but the hunger beneath never changes. In gameplay, they alone can steal relics from other factions, feeding their power through theft and devotion. They earn points by scavenging relics and resources from abandoned or devastated regions, turning desolation into strength. Though their rituals may appear ominous, the Faith are not destroyers—they are the quiet cleanup crew of the fallen world, inheritors of what others abandon. Their obsession with relics, however, corrodes their surroundings, slowly draining their resilience as their faith’s hunger spreads across the land.",
    specialMechanic: {},
    startingRelic: "🕯️ Chalice of Ash",
    defaultTraits: { prowess: 3, resilience: 4, economy: 5 },
    relationships: {
      "Devoured Faith": "self",
      "Spider Court": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelid Monarchy": "neutral",
      "Crimson Horde": "neutral"
    },
    flag: "",
    palette: ["#0F1417", "#C9B037", "#004E59"]
  },
  {
    name: "The Jade Empire",
    emoji: "🐸",
    overview: "Gold flows like a river—and that’s exactly where the Jade Empire sits.",
    fullLore:
      "The Jade Empire thrives on the pulse of trade. To them, profit is not merely power—it is survival. Built upon centuries of mercantile mastery, they dominate diplomacy and commerce alike, holding the world’s economies in their emerald grasp. The frogs, doves, and cranes each serve a distinct role: the frogs are merchants and politicians, the doves handle diplomacy, and the few remaining cranes work as mercenaries protecting the markets.\n\nTheir empire values wealth above all else. If exile promises gold, they will gladly sell peace to the highest bidder. Other factions rely heavily on their networks; should the Jade Empire cut trade with one, others soon follow. This interwoven reliance ensures their control—starvation of supply and alliance alike.\n\nIn gameplay, they dictate trade and diplomacy. The Jade Empire can impose embargoes, grant favor, or manipulate trade to raise or ruin economies. They earn wealth through transactions and alliances, making every move at the table flow through them. Yet their greed makes them vulnerable—should their trade web collapse, so too does their influence.",
    specialMechanic: {},
    startingRelic: "🐸 Coin of Currents",
    defaultTraits: { prowess: 3, resilience: 4, economy: 7 },
    relationships: {
      "Devoured Faith": "neutral",
      "Spider Court": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "self",
      "Mycelid Monarchy": "neutral",
      "Crimson Horde": "neutral"
    },
    flag: "",
    palette: ["#00FF7F", "#20B2AA", "#FFFFFF"]
  },
  {
    name: "The Meadowfolk Union",
    emoji: "🐭",
    overview: "Among the ruins, they build again. Among the people, they are rebels.",
    fullLore:
      "The Meadowfolk Union emerged not from the ruins of empires, but from the yearning for belonging. They are wanderers, builders, and dreamers who seek only one thing—a place to call home. Forged in the aftermath of countless wars, they turned from the endless cycle of conquest and revenge, believing that survival is not enough without community.\n\nThey are a democracy without leaders, guided instead by the collective voice of their people. Every decision is made through constant, shifting votes, organized by volunteers who rotate freely, ensuring that no single voice holds power for long. In their camps and burrows, everyone’s word carries weight, and no one stands above another.\n\nThe Meadowfolk are adaptive beyond compare. They can shift from explosive rebellion to disciplined militancy, or from peaceful trade to follower-based unity within mere turns. Their armies burrow, climb, and scurry through any terrain, evolving faster than their enemies can react. This adaptability makes them unpredictable allies and resilient survivors—but to balance this gift, they cannot fully master more than two strengths at once, making their evolution a matter of choice and sacrifice.\n\nBut beneath their shifting strengths lies a single truth: all they want is acceptance, friendship, and peace throughout the world. Their power is not born from domination—but from the hope that even in a land of monsters and kings, there is still room for kindness.",
    specialMechanic: {},
    startingRelic: "🐭 Banner of Burrows",
    defaultTraits: { prowess: 4, resilience: 5, economy: 5 },
    relationships: {
      "Devoured Faith": "neutral",
      "Spider Court": "neutral",
      "Meadowfolk Union": "self",
      "Jade Empire": "neutral",
      "Mycelid Monarchy": "neutral",
      "Crimson Horde": "neutral"
    },
    flag: "",
    palette: ["#B87333", "#228B22", "#F5F5DC"]
  },
  {
    name: "The Mycelid Monarchy",
    emoji: "🦗",
    overview: "Under her rule, the spores rose again—and so did war.",
    fullLore:
      "From the damp ruins and blooming rot, the Mycelid Monarchy emerged—a hive of fungal creatures ruled by their Queen. Her spores breathed new life into decay, spreading their dominion across the soil and sky alike. They do not bring peace; they bring infection, expansion, and conversion. Some fly, others climb or dig, all serving their sovereign’s will.\n\nTheir power lies in hybridization. Through twisted evolutions, the Mycelids merge bug and fungus into one, forming hosts that can fly, dig, and spread plague. Their conversion tactics infect enemies both literally and ideologically—those who fall to their influence often rise as part of their growing hive. They are not invaders; they are an inevitability.\n\nIn gameplay, they overwhelm through spread and conversion. They thrive by overtaking terrain and turning foes into allies. Their expansion grants points but makes them vulnerable to collapse if their hive grows too large or disconnected.",
    specialMechanic: {},
    startingRelic: "🦗 Crown of Spores",
    defaultTraits: { prowess: 5, resilience: 6, economy: 3 },
    relationships: {
      "Devoured Faith": "neutral",
      "Spider Court": "neutral",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelid Monarchy": "self",
      "Crimson Horde": "neutral"
    },
    flag: "",
    palette: ["#551A8B", "#F5F5F5", "#98FB98"]
  },
  {
    name: "The Spider Court",
    emoji: "🕸️",
    overview: "Every secret is a thread—and the Spider Court spins them all.",
    fullLore:
      "Hidden deep within the shadowed caverns and hollowed ruins of their lost empire, the Spider Court plots its silent return. Once the rulers of the known world, they were cast into hiding after the fall of the old age. But the Court has waited, patient as silk—watching the world rebuild and fracture, biding their time until the moment to reclaim their dominion arrived. They do not seek vengeance; they seek restoration. The world has changed, and the Court intends to change with it—but never beneath it.\n\nThe Spider Court is a sprawling bureaucracy of schemers and manipulators bound by old law. They feed not on blood, but on information, weaving deception into law and lies into treaties. They twist negotiations, alter alliances, and sabotage conflicts, all without ever drawing a blade. Their trade in goods and influence flows easily, for while they produce much, they rely on others—chiefly the Jade Empire—to distribute their wares. Together, they maintain a fragile but lucrative dance of dependence. Yet all the while, the Court gathers secrets like flies, waiting for the perfect time to strike.\n\nIn gameplay, their power of manipulation is immense—but it comes at a cost. Maintaining their intricate network of espionage and diplomacy slowly drains their economy, forcing players to balance deceit with sustainability. Their grudges run deep, and when they turn their focus toward an enemy, they can rally the entire board against them—not through might, but through quiet, ruthless persuasion.",
    specialMechanic: {},
    startingRelic: "🕸️ Web of Lies",
    defaultTraits: { prowess: 2, resilience: 3, economy: 6 },
    relationships: {
      "Devoured Faith": "neutral",
      "Spider Court": "self",
      "Meadowfolk Union": "neutral",
      "Jade Empire": "neutral",
      "Mycelid Monarchy": "neutral",
      "Crimson Horde": "neutral"
    },
    flag: "",
    palette: ["#C0C0C0", "#001F3F", "#E5B3BB"]
  }
];
console.log("✅ factions.js loaded", factions);