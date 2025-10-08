
const { updatePaymentPerJoin, updatePaymentPerInvite, config } = require('../utils/config');

const OWNER_ID = '1309720025912971355';

async function handleConfigCommands(interaction) {
  // Check if user is owner
  if (interaction.user.id !== OWNER_ID) {
    await interaction.reply({ 
      content: '🚫 Only the bot owner can use this command.', 
      ephemeral: true 
    });
    return true;
  }

  if (interaction.commandName === 'setjoinpayment') {
    const amount = interaction.options.getNumber('amount');
    
    if (amount < 0) {
      await interaction.reply({ 
        content: '❌ Amount must be a positive number.', 
        ephemeral: true 
      });
      return true;
    }

    updatePaymentPerJoin(amount);
    await interaction.reply({ 
      content: `✅ Payment per join updated to **${amount}sx**`, 
      ephemeral: true 
    });
    return true;
  }

  if (interaction.commandName === 'setinvitepayment') {
    const amount = interaction.options.getNumber('amount');
    
    if (amount < 0) {
      await interaction.reply({ 
        content: '❌ Amount must be a positive number.', 
        ephemeral: true 
      });
      return true;
    }

    updatePaymentPerInvite(amount);
    await interaction.reply({ 
      content: `✅ Payment per invite updated to **${amount}sx**`, 
      ephemeral: true 
    });
    return true;
  }

  if (interaction.commandName === 'viewconfig') {
    const configInfo = `⚙️ **Current Payment Configuration**\n\n` +
      `💰 Payment per Join: **${config.paymentPerJoin}sx**\n` +
      `🎁 Payment per Invite: **${config.paymentPerInvite}sx**`;

    await interaction.reply({ content: configInfo, ephemeral: true });
    return true;
  }

  return false;
}

module.exports = { handleConfigCommands };
