import React, { useEffect, useState } from "react";
import { loadFactions } from "../../utils/fileLoader";
import "./../styles.css";

export default function OnboardingMenu() {
  const [factions, setFactions] = useState({});

  useEffect(() => {
    const loaded = loadFactions();
    setFactions(loaded);
  }, []);

  return (
    <div className="onboarding-container">
      <h1 className="title">Choose Your Faction</h1>
      <div className="faction-grid">
        {Object.entries(factions).map(([key, faction]) => (
          <div
            key={key}
            className="faction-card"
            style={{
              background: `linear-gradient(145deg, ${faction.palette?.[0]}, ${faction.palette?.[1]})`,
              border: `2px solid ${faction.palette?.[2] || "#fff"}`,
            }}
          >
            <div className="faction-header">
              <h2>
                {faction.emoji} {faction.name}
              </h2>
            </div>

            {faction.flag && (
              <img
                src={faction.flag}
                alt={`${faction.name} flag`}
                className="faction-flag"
              />
            )}

            <p className="overview">“{faction.overview}”</p>
          </div>
        ))}
      </div>
    </div>
  );
}
