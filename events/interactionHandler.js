
const { handleCommands } = require('../commands/commandHandler');
const { handleButtons } = require('../commands/buttonHandler');

async function handleInteraction(interaction, client) {
  if (interaction.isChatInputCommand()) {
    await handleCommands(interaction, client);
  } else if (interaction.isButton()) {
    await handleButtons(interaction, client);
  }
}

module.exports = { handleInteraction };
