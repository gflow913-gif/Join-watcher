
async function handleRgbCommands(interaction) {
  if (interaction.commandName !== 'givergb' && interaction.commandName !== 'removergb') {
    return false;
  }

  const member = interaction.member;
  const userId = interaction.user.id;
  const ownerId = '1309720025912971355';

  if (userId !== ownerId) {
    await interaction.reply({
      content: '🚫 You are not allowed to use this command. Only the bot owner can manage RGB roles.',
      ephemeral: true
    });
    return true;
  }

  if (interaction.commandName === 'givergb') {
    await interaction.reply({
      content: '❌ This command has been removed.\n\n✨ **RGB is now built into Founder roles!**\n\nUse `/givefounder` to assign a Founder role instead:\n• Big Founder\n• Middle Founder\n• Small Founder\n\nAll Founder roles automatically have rainbow RGB animation! 🌈',
      ephemeral: true
    });
    return true;
  }

  if (interaction.commandName === 'removergb') {
    await interaction.reply({
      content: '❌ This command has been removed.\n\n✨ **RGB is now built into Founder roles!**\n\nTo remove RGB effect, simply remove the Founder role from the user in Server Settings → Members.',
      ephemeral: true
    });
    return true;
  }

  return false;
}

module.exports = { handleRgbCommands };
