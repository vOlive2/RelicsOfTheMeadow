let energy = 10;
let gold = 200;
const eventLog = document.getElementById('event-log');
const energyEl = document.getElementById('energy');

// Main action cost map
const actions = {
  'declare-war': { cost: 5, gold: 100 },
  'battle': { cost: 1, gold: 0 },
  'fortify': { cost: 2, gold: 50 },
  'build': { cost: 2, gold: 25 },
  'trade': { cost: 1, gold: 0 },
  'use-relic': { cost: 1, gold: 15 },
  'faction-abilities': { cost: 1, gold: 0 },
  'end-turn': { cost: 0, gold: 0 }
};

// 💬 Utility functions
function log(msg) {
  const p = document.createElement('p');
  p.textContent = msg;
  eventLog.prepend(p);
}

function updateHUD() {
  energyEl.textContent = `Energy: ${energy} ⚡ | Gold: ${gold} 💰`;
}

function spend(cost, gCost, label) {
  if (energy < cost) return log(`❌ Not enough energy to ${label}!`);
  if (gold < gCost) return log(`💸 You need ${gCost} gold to ${label}!`);
  energy -= cost;
  gold -= gCost;
  updateHUD();
  log(`✅ ${label} (-${cost}⚡, -${gCost}💰)`);
  if (energy <= 0) endTurn();
}

// 🌙 End Turn Cycle
function endTurn() {
  log('🌙 Turn ended. AI factions are acting...');
  setTimeout(() => {
    log('🌅 A new day dawns!');
    energy = 10;
    gold += 25;
    updateHUD();
  }, 1500);
}

// 🧩 Action Handlers
document.querySelectorAll('#actions button').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.action;
    const { cost, gold: gCost } = actions[key];

    switch (key) {
      case 'trade':
        openTradePopup();
        break;
      case 'faction-abilities':
        openFactionPopup();
        break;
      case 'end-turn':
        endTurn();
        break;
      default:
        spend(cost, gCost, btn.textContent);
        break;
    }
  });
});

// 💰 TRADE POPUP
const tradePopup = document.getElementById('trade-popup');
const closeTrade = document.getElementById('close-trade');
closeTrade.addEventListener('click', () => tradePopup.classList.add('hidden'));

function openTradePopup() {
  tradePopup.classList.remove('hidden');
  log('📦 Managing trade routes...');
}

document.querySelectorAll('[data-trade]').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.trade;
    if (t === 'cut') log('✂️ Trade route cut. No gold spent.');
    else if (t === 'expand' && gold >= 25) { gold -= 25; log('🛣️ Expanded trade route (-25💰).'); }
    else if (t === 'deal' && gold >= 50) { gold -= 50; log('🤝 Formed new trade deal (-50💰).'); }
    else log('💸 Not enough gold!');
    updateHUD();
  });
});

// 🌟 FACTION ABILITIES POPUP
const factionPopup = document.getElementById('faction-popup');
const closeFaction = document.getElementById('close-faction');
const factionAbilitiesList = document.getElementById('faction-abilities-list');
closeFaction.addEventListener('click', () => factionPopup.classList.add('hidden'));

function openFactionPopup() {
  factionPopup.classList.remove('hidden');
  factionAbilitiesList.innerHTML = `
    <ul>
      <li>🔥 <b>Vengeance Surge</b> – Gain +2 Energy next battle.</li>
      <li>🐾 <b>Pack Tactics</b> – When attacking, add +1 hit for each allied unit nearby.</li>
    </ul>
  `;
  log('🌟 Viewing faction abilities...');
}
