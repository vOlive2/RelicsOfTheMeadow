import React from "react";
import FactionCard from "./FactionCard";
import factionsData from "../../../data/factions/factions.json"; // adjust path if needed
import "./styles.css";

export default function OnboardingMenu() {
  return (
    <div className="onboarding-container">
      <h1 className="title">Choose Your Faction</h1>
      <div className="faction-grid">
        {factionsData.map((faction) => (
          <FactionCard key={faction.name} faction={faction} />
        ))}
      </div>
    </div>
  );
}
