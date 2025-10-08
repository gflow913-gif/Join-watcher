const { handleBasicCommands } = require('./basicCommands');
const { handleTicketCommands } = require('./ticketCommands');
const { handleRgbCommands } = require('./rgbCommands');
const { handleFounderCommands } = require('./founderCommands');
const { handleClaimCommands } = require('./claimCommands');
const { handleConfigCommands } = require('./configCommands');
const { handleChannelCommands } = require('./channelCommands');

// ===== MAIN COMMAND HANDLER =====
async function handleCommands(interaction) {
  if (!interaction.isChatInputCommand()) return;

  // Try each command module - returns true if handled
  if (await handleBasicCommands(interaction)) return;
  if (await handleTicketCommands(interaction)) return;
  if (await handleRgbCommands(interaction)) return;
  if (await handleFounderCommands(interaction)) return;
  if (await handleClaimCommands(interaction)) return;
  if (await handleConfigCommands(interaction)) return;
  if (await handleChannelCommands(interaction)) return;
}

// === Helper Function for Smooth Color Fade ===
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${Math.round(f(0) * 255).toString(16).padStart(2, '0')}${Math.round(f(8) * 255).toString(16).padStart(2, '0')}${Math.round(f(4) * 255).toString(16).padStart(2, '0')}`;
}

module.exports = { handleCommands };