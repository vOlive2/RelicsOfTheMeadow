import React from "react";

export default function FactionCard({ faction, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(faction)}
      className={`cursor-pointer rounded-2xl border-4 transition-all duration-200
        ${selected?.name === faction.name ? "border-yellow-500 scale-105" : "border-transparent"}
        hover:scale-105 hover:border-yellow-300
        shadow-md bg-[#f4e1b8] bg-opacity-80 p-4 w-48 text-center`}
      style={{
        backgroundImage: "url('/assets/parchment_texture.png')",
        backgroundSize: "cover",
      }}
    >
      <img
        src={faction.symbol || "/assets/default_flag.png"}
        alt={faction.name}
        className="mx-auto w-24 h-24 object-contain rounded-lg mb-3"
      />
      <h2 className="text-lg font-bold text-gray-800">{faction.name}</h2>
      <p className="text-xs text-gray-700 mt-1">{faction.overviewLore}</p>
    </div>
  );
}
