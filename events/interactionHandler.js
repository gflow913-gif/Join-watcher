const { handleCommands } = require('../commands/commandHandler');
const { handleLotteryButtons } = require('../commands/lotteryButtonHandler');
const { handleButtons } = require('../commands/buttonHandler');

async function handleInteraction(interaction, client) {
  if (interaction.isChatInputCommand()) {
    await handleCommands(interaction);
  } else if (interaction.isButton()) {
    if (await handleLotteryButtons(interaction)) return;
    await handleButtons(interaction, client);
  }
}

module.exports = { handleInteraction };