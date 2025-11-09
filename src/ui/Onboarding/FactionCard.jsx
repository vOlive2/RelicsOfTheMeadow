import React from "react";

export default function FactionCard({ faction }) {
  return (
    <div className="faction-card">
      <div className="faction-emoji">{faction.emoji || "🏳️"}</div>
      <h2>{faction.name}</h2>
      <p>{faction.overview}</p>
    </div>
  );
}
