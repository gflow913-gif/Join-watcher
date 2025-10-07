const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const CLAIM_PANEL_CHANNEL_ID = '1408286047732760677';

async function handleClaimCommands(interaction) {
  if (interaction.commandName === 'setupclaimpanel') {
    try {
      const channel = await interaction.client.channels.fetch(CLAIM_PANEL_CHANNEL_ID).catch(() => null);
      
      if (!channel || !channel.isTextBased()) {
        await interaction.reply({ content: '❌ Could not find the claim panel channel.', ephemeral: true });
        return true;
      }

      const embed = new EmbedBuilder()
        .setTitle('Claim Panel')
        .setDescription('> To create a ticket use the Create Ticket button below.')
        .setColor(0x0099FF);

      const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('📩 Create Ticket')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: '✅ Claim panel has been set up successfully!', ephemeral: true });
      return true;
    } catch (error) {
      console.error('Error setting up claim panel:', error);
      await interaction.reply({ content: '❌ Error setting up claim panel.', ephemeral: true });
      return true;
    }
  }

  return false;
}

module.exports = { handleClaimCommands };
