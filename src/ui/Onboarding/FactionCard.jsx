import React from "react";

export default function FactionCard({ faction }) {
  const { name, emoji, overview, palette } = faction;

  return (
    <div
      className="faction-card"
      style={{
        background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]})`,
        border: `3px solid ${palette[2]}`
      }}
    >
      <div className="faction-emoji">{emoji}</div>
      <div className="faction-name">{name}</div>
      <div className="faction-overview">{overview}</div>
    </div>
  );
}
