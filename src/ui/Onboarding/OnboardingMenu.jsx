import React from "react";
import FactionCard from "./FactionCard";
import "./OnboardingMenu.css"; // optional if you want separate styling

const factions = [
  {
    id: 1,
    name: "The Devoured Faith",
    description: "Fanatics who consume relics to ascend their godless hunger.",
    emoji: "🕯️",
  },
  {
    id: 2,
    name: "The Spider Court",
    description: "Whispering nobles who weave webs of deceit and beauty.",
    emoji: "🕸️",
  },
  {
    id: 3,
    name: "The Meadowfolk Union",
    description: "Peaceful farmers turned revolutionaries for freedom and soil.",
    emoji: "🌾",
  },
  {
    id: 4,
    name: "The Jade Empire",
    description: "Scholars and warriors guided by balance and divine order.",
    emoji: "🐉",
  },
  {
    id: 5,
    name: "The Mycelid Monarchy",
    description: "Hive-minded spore lords who grow empires beneath the earth.",
    emoji: "🍄",
  },
  {
    id: 6,
    name: "The Crimson Horde",
    description: "Blood-sworn warriors who thrive in chaos and conquest.",
    emoji: "🩸",
  },
];

export default function OnboardingMenu() {
  return (
    <div className="onboarding-container">
      <h1 className="title">Choose Your Faction</h1>
      <div className="faction-grid">
        {factions.map((faction) => (
          <FactionCard key={faction.id} faction={faction} />
        ))}
      </div>
    </div>
  );
}
