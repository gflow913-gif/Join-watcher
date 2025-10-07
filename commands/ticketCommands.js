
const { ChannelType } = require('discord.js');

async function handleTicketCommands(interaction) {
  if (interaction.commandName === 'setupticket') {
    const guild = interaction.guild;
    let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);

    if (!category) {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
      });
    }

    await interaction.reply({ content: '🎫 Ticket system setup complete.', ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'createroles') {
    const guild = interaction.guild;
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    for (const color of colors) {
      await guild.roles.create({
        name: `RGB-${color}`,
        color,
      });
    }
    await interaction.reply({ content: '✅ RGB color roles created!', ephemeral: true });
    return true;
  }

  return false;
}

module.exports = { handleTicketCommands };
