
const { EmbedBuilder } = require('discord.js');
const { casinoConfig, saveCasinoConfig } = require('../utils/casinoManager');

async function handleCasinoConfigCommands(interaction) {
  const ownerId = '1309720025912971355';
  const userId = interaction.user.id;

  if (interaction.commandName === 'configcasino') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 Only the bot owner can configure casino settings.',
        ephemeral: true
      });
      return true;
    }

    const setting = interaction.options.getString('setting');
    const value = interaction.options.getNumber('value');

    switch (setting) {
      case 'minbet':
        casinoConfig.minBet = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Minimum bet set to **${value} coins**`, 
          ephemeral: true 
        });
        break;
      
      case 'maxbet':
        casinoConfig.maxBet = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Maximum bet set to **${value} coins**`, 
          ephemeral: true 
        });
        break;
      
      case 'dicethreshold':
        casinoConfig.diceWinThreshold = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Dice win threshold set to **${value}**`, 
          ephemeral: true 
        });
        break;
      
      case 'dicemultiplier':
        casinoConfig.diceMultiplier = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Dice multiplier set to **x${value}**`, 
          ephemeral: true 
        });
        break;
      
      case 'coinmultiplier':
        casinoConfig.coinFlipMultiplier = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Coin flip multiplier set to **x${value}**`, 
          ephemeral: true 
        });
        break;
      
      case 'slottriple':
        casinoConfig.slotMultipliers.triple = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Slot triple match multiplier set to **x${value}**`, 
          ephemeral: true 
        });
        break;
      
      case 'slotdouble':
        casinoConfig.slotMultipliers.double = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Slot double match multiplier set to **x${value}**`, 
          ephemeral: true 
        });
        break;
      
      case 'dailybonus':
        casinoConfig.dailyBonus = value;
        saveCasinoConfig();
        await interaction.reply({ 
          content: `✅ Daily bonus set to **${value} coins**`, 
          ephemeral: true 
        });
        break;
    }
    return true;
  }

  if (interaction.commandName === 'viewcasinoconfig') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 Only the bot owner can view casino configuration.',
        ephemeral: true
      });
      return true;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎰 Casino Configuration')
      .addFields(
        { name: '💰 Minimum Bet', value: `${casinoConfig.minBet} coins`, inline: true },
        { name: '💰 Maximum Bet', value: `${casinoConfig.maxBet} coins`, inline: true },
        { name: '🎲 Dice Win Threshold', value: `${casinoConfig.diceWinThreshold}+`, inline: true },
        { name: '🎲 Dice Multiplier', value: `x${casinoConfig.diceMultiplier}`, inline: true },
        { name: '🪙 Coin Flip Multiplier', value: `x${casinoConfig.coinFlipMultiplier}`, inline: true },
        { name: '🎰 Slot Triple Match', value: `x${casinoConfig.slotMultipliers.triple}`, inline: true },
        { name: '🎰 Slot Double Match', value: `x${casinoConfig.slotMultipliers.double}`, inline: true },
        { name: '🎁 Daily Bonus', value: `${casinoConfig.dailyBonus} coins`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  }

  return false;
}

module.exports = { handleCasinoConfigCommands };
