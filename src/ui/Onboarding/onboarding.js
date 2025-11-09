// src/ui/Onboarding/onboarding.js
import { loadFactions } from "../../utils/fileLoader.js";

function createFactionCard(f) {
  const card = document.createElement('button');
  card.className = 'faction-card';
  card.type = 'button';

  const emoji = document.createElement('div');
  emoji.className = 'faction-emoji';
  emoji.textContent = f.emoji || '🏳️';

  const title = document.createElement('h2');
  title.className = 'faction-name';
  title.textContent = f.name;

  const p = document.createElement('p');
  p.className = 'faction-overview';
  p.textContent = f.overview;

  card.appendChild(emoji);
  card.appendChild(title);
  card.appendChild(p);

  // click handler: mark selected and show chosen label
  card.addEventListener('click', () => {
    document.querySelectorAll('.faction-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    const chosen = document.getElementById('chosen-faction');
    chosen.textContent = `You chose: ${f.name}`;
    chosen.dataset.key = f.key;
  });

  return card;
}

async function mount() {
  const root = document.getElementById('root');
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'onboarding-container';

  const title = document.createElement('h1');
  title.className = 'title';
  title.textContent = 'Choose Your Faction';

  const grid = document.createElement('div');
  grid.className = 'faction-grid';

  const infoRow = document.createElement('div');
  infoRow.className = 'info-row';
  const chosen = document.createElement('div');
  chosen.id = 'chosen-faction';
  chosen.className = 'chosen';
  chosen.textContent = 'No faction chosen';
  infoRow.appendChild(chosen);

  container.appendChild(title);
  container.appendChild(grid);
  container.appendChild(infoRow);
  root.appendChild(container);

  // loading
  const loader = document.createElement('div');
  loader.className = 'loading';
  loader.textContent = 'Loading factions...';
  grid.appendChild(loader);

  const factions = await loadFactions();

  // remove loader
  if (loader.parentNode) loader.parentNode.removeChild(loader);

  if (!factions || factions.length === 0) {
    const err = document.createElement('div');
    err.className = 'error';
    err.textContent = 'Could not load faction data.';
    grid.appendChild(err);
    return;
  }

  factions.forEach(f => {
    const card = createFactionCard(f);
    grid.appendChild(card);
  });
}

// run on load
mount();
