# 🌿 Relics of the Meadow

*A cozy survival sandbox about building, exploring, crafting, and facing ancient Beasts in a living, ever-expanding world.*

Play the GitHub Pages build here:
👉 https://volive-io.github.io/RelicsOfTheMeadow/

# ⭐ About the Game

Relics of the Meadow is a single-player world-building strategy sandbox where you start on a tiny 5×5 frontier and grow it tile by tile.
Build homes, tend your economy, craft powerful structures, explore dangerous biomes, discover rare Clearings, and defeat colossal Beasts hiding in the deep.

There are no AI factions — only you, your people, and the mysteries of the land.

## 🚀 Quick Start

1. Clone the repo or download the ZIP.
2. Open `index.html` in your browser. (No build step required.)
3. Click **“Enter the Meadow”** to pick your faction and load the main HUD (`src/game/index.html`).
4. Select a clearing, build outposts, and explore in the four cardinal directions.
5. Use the **🏛️ Trade** action to send caravans or collect imports once you’ve stockpiled goods.

> Tip: hover any clearing to see ownership, rarity bonuses, and Beast alerts.  
> Click it to access contextual Explore/Battle buttons.

## 🧩 Core Systems

| System | Details |
| --- | --- |
| **Even 5×5 Grid** | Map tiles are generated in a balanced square and expand in rings as you explore.  Only your faction occupies the grid at start; rival factions exist off-map for narrative hooks. |
| **Buildings & Blueprints** | Terrain-aware building menu with scaling material costs and upgrade paths (Mine Shaft → Mine Hub, Tech Lab → Apex Research Laboratory, etc.). |
| **Resources & Ore Subtypes** | Logs/Stone/Clay sit alongside an “Ore” category that branches into Mythril, Gold, Meadowheart Opal, Silktone Obsidian, Starpetal Ore, and Lumen Quartz.  Each is unlocked the first time you acquire it and hidden otherwise. |
| **Trade & Imports** | The former Commerce action is now **Trade**.  Spend energy to ship harvested goods or crack open imports for instant boosts. |
| **Festivals & Seasonal Events** | Trigger your own festivals for happiness buffs, while world events (Rainstorm, Harvest Moon, etc.) roll in automatically and modify production. |
| **Beast Encounters** | Exploring into Deep Oceans, Caves, or Mountains can uncover Beasts.  Engage them via the clearing tooltip to win rare ores and Magical Essence. |

## 🧭 Controls & Flow

- **Build** – Costs crafting materials; tap a clearing, open the Build modal, and construct or upgrade structures.
- **Explore** – Select a clearing and choose a direction from the contextual buttons beneath the map.
- **Harvest** – Collect output from every production building, with current event modifiers applied.
- **Trade** – Run caravans (⚡1) or collect imports instantly; the panel also shows stored crates.
- **Festival** – Consumes Wheat + Fruits to trigger a temporary production/happiness surge.
- **Recruit / Delve / Use Relic** – Carry over from earlier builds; gold still funds armies & relic expeditions.

## 📁 Project Layout

```
src/
├── data/          # Factions, building definitions, resource & event data
├── game/          # Main HUD, bootstrap helpers, older turn systems
├── managers/      # Map, crafting, resources, population, events, combat
├── styles/        # Split CSS (layout, map, panels, buttons, etc.)
├── ui/            # UI-specific render helpers (map grid, HUD panels)
└── utils/         # Shared calculators (derived stats, helpers)
```

## 🛠️ Debug / Dev Notes

- Use the browser console to inspect `player` state (e.g. `window.player` once the HUD loads).
- `eventManager` exposes `getActiveEvents()` if you want to confirm seasonal buffs.
- Resource tiles remain hidden until you actually earn that material, keeping the HUD tidy.
- Clearing IDs now start at **1** and the grid stays perfectly square, so numbering and layout are predictable.

Enjoy shepherding your people through the Meadow! 🌱
