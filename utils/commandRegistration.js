const { SlashCommandBuilder, REST, Routes } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('checkuser')
    .setDescription('Check user information'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show server stats'),

  new SlashCommandBuilder()
    .setName('scanexisting')
    .setDescription('Scan all existing members and record them'),

  new SlashCommandBuilder()
    .setName('unclaimed')
    .setDescription('Show unclaimed join list'),

  new SlashCommandBuilder()
    .setName('claim')
      .setDescription('Mark a user as claimed')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to claim')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('invites')
      .setDescription('Check invite stats for a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to check (leave empty for yourself)')
          .setRequired(false)
      ),

  new SlashCommandBuilder()
    .setName('setupticket')
    .setDescription('Setup a ticket system'),

  new SlashCommandBuilder()
    .setName('createroles')
    .setDescription('Create RGB color roles'),

  // === Founder Role Assignment ===
  new SlashCommandBuilder()
    .setName('givefounder')
    .setDescription('Assign a Founder role to a user (Owner only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give the Founder role to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('role')
        .setDescription('Select the Founder role to assign')
        .setRequired(true)
        .addChoices(
          { name: 'Big Founder', value: 'Big Founder' },
          { name: 'Middle Founder', value: 'Middle Founder' },
          { name: 'Small Founder', value: 'Small Founder' }
        )
    ),

  // === Fix Founder Roles ===
  new SlashCommandBuilder()
    .setName('fixfounder')
    .setDescription('Fix Founder roles position and settings (Owner only)'),

  // === Clean Duplicate Roles ===
  new SlashCommandBuilder()
    .setName('cleanduplicates')
    .setDescription('Remove duplicate Founder roles (Owner only)'),

  // === Start RGB Animation ===
  new SlashCommandBuilder()
    .setName('startrgb')
    .setDescription('Start RGB animation for Founder roles (Owner only)'),

  // === Setup Claim Panel ===
  new SlashCommandBuilder()
    .setName('setupclaimpanel')
    .setDescription('Setup the claim panel in the designated channel'),

  // === Config Commands (Owner Only) ===
  new SlashCommandBuilder()
    .setName('setjoinpayment')
    .setDescription('Set payment amount per join (Owner only)')
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('Amount in sx')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setinvitepayment')
    .setDescription('Set payment amount per invite (Owner only)')
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('Amount in sx')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('viewconfig')
    .setDescription('View current payment configuration (Owner only)'),

  // === Channel Management (Owner Only) ===
  new SlashCommandBuilder()
    .setName('deletechannel')
    .setDescription('Delete a channel (Owner only)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to delete')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('deletecategory')
    .setDescription('Delete a category and all its channels (Owner only)')
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('The category to delete')
        .setRequired(true)
    ),

  // === Casino Commands ===
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your casino balance')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Check another user\'s balance')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('betdice')
    .setDescription('Roll the dice and bet on the outcome')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName('betcoin')
    .setDescription('Flip a coin and bet on the outcome')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Choose heads or tails')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
    ),

  new SlashCommandBuilder()
    .setName('betslots')
    .setDescription('Spin the slot machine')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the casino leaderboard'),

  new SlashCommandBuilder()
    .setName('claimbonus')
    .setDescription('Claim your daily bonus'),

  // === Casino Config (Owner Only) ===
  new SlashCommandBuilder()
    .setName('configcasino')
    .setDescription('Configure casino settings (Owner only)')
    .addStringOption(option =>
      option.setName('setting')
        .setDescription('Setting to configure')
        .setRequired(true)
        .addChoices(
          { name: 'Minimum Bet', value: 'minbet' },
          { name: 'Maximum Bet', value: 'maxbet' },
          { name: 'Dice Win Threshold', value: 'dicethreshold' },
          { name: 'Dice Multiplier', value: 'dicemultiplier' },
          { name: 'Coin Flip Multiplier', value: 'coinmultiplier' },
          { name: 'Slot Triple Match Multiplier', value: 'slottriple' },
          { name: 'Slot Double Match Multiplier', value: 'slotdouble' },
          { name: 'Daily Bonus Amount', value: 'dailybonus' }
        )
    )
    .addNumberOption(option =>
      option.setName('value')
        .setDescription('New value for the setting')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('viewcasinoconfig')
    .setDescription('View casino configuration (Owner only)'),

  // === Lottery Commands (Owner Only) ===
  new SlashCommandBuilder()
    .setName('createlottery')
    .setDescription('Create a new lottery (Owner only)')
    .addIntegerOption(option =>
      option.setName('ticketprice')
        .setDescription('Price per ticket in coins')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option.setName('ticketcount')
        .setDescription('Number of tickets available')
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName('configlottery')
    .setDescription('Manually configure lottery winner (Owner only)')
    .addStringOption(option =>
      option.setName('lotteryid')
        .setDescription('Lottery ID')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('winner')
        .setDescription('User to set as winner')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('endlottery')
    .setDescription('End lottery and pick random winner (Owner only)')
    .addStringOption(option =>
      option.setName('lotteryid')
        .setDescription('Lottery ID')
        .setRequired(true)
    )
].map(command => command.toJSON());

async function registerCommands(client) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

module.exports = { registerCommands };