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

  // === New RGB Commands ===
  new SlashCommandBuilder()
    .setName('givergb')
    .setDescription('Give yourself an RGB glowing name (Founder roles only)'),

  new SlashCommandBuilder()
    .setName('removergb')
    .setDescription('Remove your RGB glowing name (Founder roles only)')
].map(command => command.toJSON());

async function registerCommands(client) {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

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