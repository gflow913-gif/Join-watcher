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
    .setDescription('Mark join as claimed')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to claim')
        .setRequired(true)
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
    .setDescription('Remove duplicate Founder roles (Owner only)')
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