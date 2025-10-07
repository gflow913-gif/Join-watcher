const { ChannelType } = require('discord.js');
const { memberData, saveData } = require('../utils/dataManager');

// ===== MAIN COMMAND HANDLER =====
async function handleCommands(interaction) {
  if (!interaction.isChatInputCommand()) return;

  // =====================
  // === BASIC COMMANDS ===
  // =====================

  if (interaction.commandName === 'checkuser') {
    await interaction.reply({ content: `👤 Checked user: ${interaction.user.username}`, ephemeral: true });
  }

  else if (interaction.commandName === 'stats') {
    const guild = interaction.guild;
    await interaction.reply({
      content: `📊 Server Stats:\nMembers: ${guild.memberCount}\nName: ${guild.name}`,
      ephemeral: true
    });
  }

  else if (interaction.commandName === 'scanexisting') {
    await interaction.deferReply({ ephemeral: true });
    
    const guild = interaction.guild;
    const members = await guild.members.fetch();
    let count = 0;

    members.forEach(member => {
      if (!member.user.bot && !memberData[member.id]) {
        memberData[member.id] = { joinedAt: member.joinedAt, claimed: false };
        count++;
      }
    });

    saveData();
    await interaction.editReply({ content: `🔍 Scanned ${count} new members and added to database.` });
  }

  else if (interaction.commandName === 'unclaimed') {
    const unclaimed = Object.entries(memberData)
      .filter(([_, data]) => !data.claimed)
      .map(([id]) => `<@${id}>`);

    if (unclaimed.length === 0) {
      await interaction.reply({ content: '✅ All joins are claimed.', ephemeral: true });
    } else {
      await interaction.reply({ content: `🧾 Unclaimed Joins:\n${unclaimed.join('\n')}`, ephemeral: true });
    }
  }

  else if (interaction.commandName === 'claim') {
    const user = interaction.options.getUser('user');
    if (!memberData[user.id]) {
      await interaction.reply({ content: '❌ User not found in database.', ephemeral: true });
      return;
    }

    memberData[user.id].claimed = true;
    saveData();
    await interaction.reply({ content: `✅ Marked ${user.username} as claimed.`, ephemeral: true });
  }

  else if (interaction.commandName === 'setupticket') {
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
  }

  else if (interaction.commandName === 'createroles') {
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
  }

  // =====================
  // === SMOOTH RGB SYSTEM (STRICT ACCESS) ===
  // =====================
  else if (interaction.commandName === 'givergb' || interaction.commandName === 'removergb') {
    const member = interaction.member;
    const guild = interaction.guild;
    const userId = interaction.user.id;

    // Your personal user ID (admin access)
    const ownerId = '1309720025912971355';

    // Founder roles
    const allowedRoles = ['Big Founder', 'Middle Founder', 'Small Founder'];

    // Check if user is you or a Founder
    const isAllowed =
      userId === ownerId ||
      member.roles.cache.some(r => allowedRoles.includes(r.name));

    if (!isAllowed) {
      await interaction.reply({
        content: '🚫 You are not allowed to use this command. Only Founders and the bot owner can use it.',
        ephemeral: true
      });
      return;
    }

    // === /givergb ===
    if (interaction.commandName === 'givergb') {
      await interaction.deferReply({ ephemeral: true });
      
      let rgbRole = guild.roles.cache.find(r => r.name === 'RGB Name');

      if (!rgbRole) {
        rgbRole = await guild.roles.create({
          name: 'RGB Name',
          color: 0xff0000,
          position: guild.roles.cache.size - 1,
          reason: 'Created for RGB glowing name system'
        });

        // Smooth color fade animation
        let hue = 0;
        setInterval(async () => {
          if (!rgbRole || !guild.roles.cache.has(rgbRole.id)) return;
          hue = (hue + 8) % 360;
          const color = hslToHex(hue, 100, 50);
          await rgbRole.setColor(color).catch(() => {});
        }, 500);
      }

      await member.roles.add(rgbRole).catch(console.error);
      await interaction.editReply({
        content: '🌈 RGB effect added! Your name will now glow smoothly with colors.'
      });
    }

    // === /removergb ===
    else if (interaction.commandName === 'removergb') {
      const rgbRole = member.guild.roles.cache.find(r => r.name === 'RGB Name');

      if (!rgbRole || !member.roles.cache.has(rgbRole.id)) {
        await interaction.reply({
          content: '❌ You don’t currently have the RGB Name role.',
          ephemeral: true
        });
        return;
      }

      await member.roles.remove(rgbRole).catch(console.error);
      await interaction.reply({
        content: '✅ RGB effect removed. Your name color is now normal again.',
        ephemeral: true
      });
    }
  }

  // =====================
  // === FOUNDER ROLE ASSIGNMENT (OWNER ONLY) ===
  // =====================
  else if (interaction.commandName === 'givefounder') {
    const ownerId = '1309720025912971355';
    const userId = interaction.user.id;

    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command. Only the bot owner can assign Founder roles.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user');
    const roleName = interaction.options.getString('role');
    const guild = interaction.guild;
    const targetMember = await guild.members.fetch(targetUser.id);

    let founderRole = guild.roles.cache.find(r => r.name === roleName);

    if (!founderRole) {
      const botMember = await guild.members.fetch(interaction.client.user.id);
      const botTopRole = botMember.roles.highest;
      
      founderRole = await guild.roles.create({
        name: roleName,
        color: 0xFF0000,
        hoist: true,
        position: botTopRole.position - 1,
        reason: `Created by ${interaction.user.username} for Founder role system`
      });
    } else {
      const botMember = await guild.members.fetch(interaction.client.user.id);
      const botTopRole = botMember.roles.highest;
      
      await founderRole.edit({ 
        hoist: true,
        position: botTopRole.position - 1
      }).catch(console.error);
    }

    await targetMember.roles.add(founderRole).catch(console.error);
    await interaction.editReply({
      content: `✅ Successfully assigned **${roleName}** role to ${targetUser.username}!`
    });
  }

  // =====================
  // === FIX FOUNDER ROLES (OWNER ONLY) ===
  // =====================
  else if (interaction.commandName === 'fixfounder') {
    const ownerId = '1309720025912971355';
    const userId = interaction.user.id;

    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const founderRoleNames = ['Big Founder', 'Middle Founder', 'Small Founder'];
    const botMember = await guild.members.fetch(interaction.client.user.id);
    const botTopRole = botMember.roles.highest;

    let fixedCount = 0;
    let message = '🔧 Fixing Founder roles...\n\n';

    for (const roleName of founderRoleNames) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        try {
          await role.edit({
            hoist: true,
            position: botTopRole.position - 1,
            color: 0xFF0000
          });
          message += `✅ Fixed: ${roleName}\n`;
          fixedCount++;
        } catch (error) {
          message += `❌ Failed: ${roleName} - ${error.message}\n`;
        }
      } else {
        message += `⚠️ Not found: ${roleName}\n`;
      }
    }

    message += `\n📊 Fixed ${fixedCount} role(s). RGB animation should work now!`;
    await interaction.editReply({ content: message });
  }
}

// === Helper Function for Smooth Color Fade ===
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${Math.round(f(0) * 255).toString(16).padStart(2, '0')}${Math.round(f(8) * 255).toString(16).padStart(2, '0')}${Math.round(f(4) * 255).toString(16).padStart(2, '0')}`;
}

module.exports = { handleCommands };