document.addEventListener('DOMContentLoaded', () => {
  const factionList = document.getElementById('faction-list');

  // Safety check if the factions variable exists
  if (typeof factions === 'undefined' || !Array.isArray(factions)) {
    factionList.innerHTML = '<p style="color:red;">⚠️ No faction data found!</p>';
    console.error('No faction data found. Make sure data/factions.js defines "factions".');
    return;
  }

  // Clear any placeholder content
  factionList.innerHTML = '';

  // Create a card for each faction
  factions.forEach(faction => {
    const card = document.createElement('div');
    card.className = 'faction-card';
    card.style.border = `3px solid ${faction.palette?.[0] || '#555'}`;

    card.innerHTML = `
      <div class="faction-header">
        <span class="faction-emoji">${faction.emoji || '❓'}</span>
        <h2 class="faction-name">${faction.name}</h2>
      </div>
      <p class="faction-overview">${faction.overview}</p>
      <div class="faction-traits">
        <p>⚔️ <strong>Prowess:</strong> ${faction.defaultTraits?.prowess ?? '?'}</p>
        <p>🍃 <strong>Resilience:</strong> ${faction.defaultTraits?.resilience ?? '?'}</p>
        <p>💰 <strong>Economy:</strong> ${faction.defaultTraits?.economy ?? '?'}</p>
      </div>
      <button class="select-btn">Pledge to ${faction.name}</button>
    `;

    card.querySelector('.select-btn').addEventListener('click', () => {
      localStorage.setItem('selectedFaction', faction.name);
      alert(`You’ve pledged to ${faction.name}! 🌿`);
      localStorage.setItem("chosenFaction", faction.name);
      window.location.href = '../../game/index.html'; // adjust if needed
    });

    factionList.appendChild(card);
  });
});
