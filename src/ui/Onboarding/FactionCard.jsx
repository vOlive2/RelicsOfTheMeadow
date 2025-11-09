import React from "react";

export default function FactionCard({ name, selected, onClick }) {
  return (
    <div
      className={`faction-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <h2>{name}</h2>
    </div>
  );
}
