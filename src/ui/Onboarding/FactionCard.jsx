import React from "react";

export default function FactionCard({ faction }) {
  const { name, emoji, overview, palette } = faction;

  return (
    <div
      className="faction-card"
      style={{
        "--card-border": palette?.[0] || "#bfa27a",
        "--card-bg": palette?.[1] || "#fffaf0",
      }}
    >
      <div className="faction-header">
        <span className="faction-emoji">{emoji}</span>
        <h2 className="faction-name">{name}</h2>
      </div>
      <p className="faction-overview">{overview}</p>
    </div>
  );
}
