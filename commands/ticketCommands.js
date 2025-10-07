
const { ChannelType } = require('discord.js');

async function handleTicketCommands(interaction) {
  if (interaction.commandName === 'setupticket') {
    await interaction.deferReply({ ephemeral: true });
    
    const guild = interaction.guild;
    let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);

    if (!category) {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
      });
    }

    await interaction.editReply({ content: '🎫 Ticket system setup complete.' });
    return true;
  }

  if (interaction.commandName === 'createroles') {
    await interaction.deferReply({ ephemeral: true });
    
    const guild = interaction.guild;
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    for (const color of colors) {
      await guild.roles.create({
        name: `RGB-${color}`,
        color,
      });
    }
    await interaction.editReply({ content: '✅ RGB color roles created!' });
    return true;
  }

  return false;
}

module.exports = { handleTicketCommands };
