
const { PermissionFlagsBits } = require('discord.js');

async function handleChannelCommands(interaction) {
  const ownerId = '1309720025912971355';
  const userId = interaction.user.id;

  if (interaction.commandName === 'deletechannel') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command.',
        ephemeral: true
      });
      return true;
    }

    const channel = interaction.options.getChannel('channel');
    
    try {
      await channel.delete();
      await interaction.reply({
        content: `✅ Successfully deleted channel: **${channel.name}**`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error deleting channel:', error);
      await interaction.reply({
        content: `❌ Failed to delete channel: ${error.message}`,
        ephemeral: true
      });
    }
    return true;
  }

  if (interaction.commandName === 'deletecategory') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command.',
        ephemeral: true
      });
      return true;
    }

    const category = interaction.options.getChannel('category');
    
    if (category.type !== 4) { // 4 = GuildCategory
      await interaction.reply({
        content: '❌ The selected channel is not a category.',
        ephemeral: true
      });
      return true;
    }

    const channelsInCategory = category.children.cache;
    const channelCount = channelsInCategory.size;

    await interaction.reply({
      content: `🗑️ Deleting category **${category.name}** and **${channelCount}** channel(s)...`,
      ephemeral: true
    });

    try {
      // Delete all channels in the category first
      for (const [, channel] of channelsInCategory) {
        await channel.delete();
      }
      
      // Then delete the category itself
      await category.delete();
      
      await interaction.followUp({
        content: `✅ Successfully deleted category **${category.name}** and **${channelCount}** channel(s).`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      await interaction.followUp({
        content: `❌ Failed to delete category: ${error.message}`,
        ephemeral: true
      });
    }
    return true;
  }

  return false;
}

module.exports = { handleChannelCommands };
