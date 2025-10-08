
const { EmbedBuilder } = require('discord.js');
const { getUserBalance, updateBalance, canClaimBonus, claimBonus, casinoData, casinoConfig } = require('../utils/casinoManager');

async function handleCasinoCommands(interaction) {
  const userId = interaction.user.id;

  // ===== BALANCE COMMAND =====
  if (interaction.commandName === 'balance') {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userData = getUserBalance(targetUser.id);
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`💰 ${targetUser.username}'s Casino Balance`)
      .addFields(
        { name: '💵 Current Balance', value: `${userData.balance} coins`, inline: true },
        { name: '📈 Total Won', value: `${userData.totalWon} coins`, inline: true },
        { name: '📉 Total Lost', value: `${userData.totalLost} coins`, inline: true },
        { name: '🎮 Games Played', value: `${userData.gamesPlayed}`, inline: true },
        { name: '💸 Net Profit', value: `${userData.totalWon - userData.totalLost} coins`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  }

  // ===== BET DICE COMMAND =====
  if (interaction.commandName === 'betdice') {
    const amount = interaction.options.getInteger('amount');
    const userData = getUserBalance(userId);

    // Validation
    if (amount < casinoConfig.minBet) {
      await interaction.reply({ content: `❌ Minimum bet is ${casinoConfig.minBet} coins!`, ephemeral: true });
      return true;
    }
    if (amount > casinoConfig.maxBet) {
      await interaction.reply({ content: `❌ Maximum bet is ${casinoConfig.maxBet} coins!`, ephemeral: true });
      return true;
    }
    if (userData.balance < amount) {
      await interaction.reply({ content: `❌ Insufficient balance! You have ${userData.balance} coins.`, ephemeral: true });
      return true;
    }

    const roll = Math.floor(Math.random() * 100) + 1;
    const isWin = roll >= casinoConfig.diceWinThreshold;
    const winAmount = Math.floor(amount * casinoConfig.diceMultiplier);
    
    if (isWin) {
      updateBalance(userId, winAmount, true);
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎲 Dice Roll - WIN!')
        .setDescription(`You rolled **${roll}** (needed ${casinoConfig.diceWinThreshold}+)`)
        .addFields(
          { name: '💰 Bet Amount', value: `${amount} coins`, inline: true },
          { name: '🏆 Winnings', value: `${winAmount} coins`, inline: true },
          { name: '💵 New Balance', value: `${userData.balance + winAmount} coins`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } else {
      updateBalance(userId, -amount, false);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎲 Dice Roll - LOSS')
        .setDescription(`You rolled **${roll}** (needed ${casinoConfig.diceWinThreshold}+)`)
        .addFields(
          { name: '💸 Lost Amount', value: `${amount} coins`, inline: true },
          { name: '💵 New Balance', value: `${userData.balance - amount} coins`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
    return true;
  }

  // ===== BET COIN FLIP COMMAND =====
  if (interaction.commandName === 'betcoin') {
    const amount = interaction.options.getInteger('amount');
    const choice = interaction.options.getString('choice');
    const userData = getUserBalance(userId);

    // Validation
    if (amount < casinoConfig.minBet) {
      await interaction.reply({ content: `❌ Minimum bet is ${casinoConfig.minBet} coins!`, ephemeral: true });
      return true;
    }
    if (amount > casinoConfig.maxBet) {
      await interaction.reply({ content: `❌ Maximum bet is ${casinoConfig.maxBet} coins!`, ephemeral: true });
      return true;
    }
    if (userData.balance < amount) {
      await interaction.reply({ content: `❌ Insufficient balance! You have ${userData.balance} coins.`, ephemeral: true });
      return true;
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = choice === result;
    const winAmount = Math.floor(amount * casinoConfig.coinFlipMultiplier);
    
    if (isWin) {
      updateBalance(userId, winAmount, true);
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🪙 Coin Flip - WIN!')
        .setDescription(`The coin landed on **${result}**! You chose **${choice}**`)
        .addFields(
          { name: '💰 Bet Amount', value: `${amount} coins`, inline: true },
          { name: '🏆 Winnings', value: `${winAmount} coins`, inline: true },
          { name: '💵 New Balance', value: `${userData.balance + winAmount} coins`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } else {
      updateBalance(userId, -amount, false);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🪙 Coin Flip - LOSS')
        .setDescription(`The coin landed on **${result}**! You chose **${choice}**`)
        .addFields(
          { name: '💸 Lost Amount', value: `${amount} coins`, inline: true },
          { name: '💵 New Balance', value: `${userData.balance - amount} coins`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
    return true;
  }

  // ===== BET SLOTS COMMAND =====
  if (interaction.commandName === 'betslots') {
    const amount = interaction.options.getInteger('amount');
    const userData = getUserBalance(userId);

    // Validation
    if (amount < casinoConfig.minBet) {
      await interaction.reply({ content: `❌ Minimum bet is ${casinoConfig.minBet} coins!`, ephemeral: true });
      return true;
    }
    if (amount > casinoConfig.maxBet) {
      await interaction.reply({ content: `❌ Maximum bet is ${casinoConfig.maxBet} coins!`, ephemeral: true });
      return true;
    }
    if (userData.balance < amount) {
      await interaction.reply({ content: `❌ Insufficient balance! You have ${userData.balance} coins.`, ephemeral: true });
      return true;
    }

    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
    
    let multiplier = 0;
    let resultText = '';
    
    if (slot1 === slot2 && slot2 === slot3) {
      multiplier = casinoConfig.slotMultipliers.triple;
      resultText = '🎰 **TRIPLE MATCH! JACKPOT!** 🎰';
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      multiplier = casinoConfig.slotMultipliers.double;
      resultText = '🎰 **DOUBLE MATCH!** 🎰';
    } else {
      resultText = '💔 **No Match**';
    }
    
    const winAmount = Math.floor(amount * multiplier);
    const isWin = multiplier > 0;
    
    if (isWin) {
      updateBalance(userId, winAmount, true);
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎰 SLOT MACHINE - WIN!')
        .setDescription(`${slot1} | ${slot2} | ${slot3}\n\n${resultText}`)
        .addFields(
          { name: '💰 Bet Amount', value: `${amount} coins`, inline: true },
          { name: '📊 Multiplier', value: `x${multiplier}`, inline: true },
          { name: '🏆 Winnings', value: `${winAmount} coins`, inline: true },
          { name: '💵 New Balance', value: `${userData.balance + winAmount} coins`, inline: false }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } else {
      updateBalance(userId, -amount, false);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎰 SLOT MACHINE - LOSS')
        .setDescription(`${slot1} | ${slot2} | ${slot3}\n\n${resultText}`)
        .addFields(
          { name: '💸 Lost Amount', value: `${amount} coins`, inline: true },
          { name: '💵 New Balance', value: `${userData.balance - amount} coins`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
    return true;
  }

  // ===== LEADERBOARD COMMAND =====
  if (interaction.commandName === 'leaderboard') {
    const topUsers = casinoData.leaderboard.slice(0, 10);
    
    if (topUsers.length === 0) {
      await interaction.reply({ content: '📊 No leaderboard data yet! Start playing to appear here!', ephemeral: true });
      return true;
    }
    
    const leaderboardText = topUsers.map((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} <@${user.userId}> - **${user.netProfit}** coins profit (Balance: ${user.balance})`;
    }).join('\n');
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Casino Leaderboard - Top Winners')
      .setDescription(leaderboardText)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    return true;
  }

  // ===== CLAIM BONUS COMMAND =====
  if (interaction.commandName === 'claimbonus') {
    if (!canClaimBonus(userId)) {
      const userData = getUserBalance(userId);
      const timeLeft = casinoConfig.bonusCooldown - (Date.now() - userData.lastBonus);
      const hoursLeft = Math.floor(timeLeft / 3600000);
      const minutesLeft = Math.floor((timeLeft % 3600000) / 60000);
      
      await interaction.reply({ 
        content: `⏰ You can claim your next bonus in **${hoursLeft}h ${minutesLeft}m**!`, 
        ephemeral: true 
      });
      return true;
    }
    
    const bonusAmount = claimBonus(userId);
    const userData = getUserBalance(userId);
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎁 Daily Bonus Claimed!')
      .setDescription(`You received **${bonusAmount} coins**!`)
      .addFields(
        { name: '💵 New Balance', value: `${userData.balance} coins`, inline: true },
        { name: '⏰ Next Bonus', value: 'Available in 24 hours', inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

module.exports = { handleCasinoCommands };
