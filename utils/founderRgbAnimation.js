function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${Math.round(f(0) * 255).toString(16).padStart(2, '0')}${Math.round(f(8) * 255).toString(16).padStart(2, '0')}${Math.round(f(4) * 255).toString(16).padStart(2, '0')}`;
}

async function startFounderRgbAnimation(client) {
  console.log('🌈 Starting Founder RGB animation...');

  const founderRoles = ['Big Founder', 'Middle Founder', 'Small Founder'];
  let hue = 0;
  let updateCount = 0;

  setInterval(async () => {
    hue = (hue + 5) % 360;
    const colorHex = hslToHex(hue, 100, 50);
    const colorInt = parseInt(colorHex.replace('#', ''), 16);

    for (const guild of client.guilds.cache.values()) {
      for (const roleName of founderRoles) {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role) {
          try {
            await role.setColor(colorInt);
            updateCount++;
            if (updateCount % 50 === 0) {
              console.log(`🎨 RGB Update #${updateCount}: ${roleName} → ${colorHex}`);
            }
          } catch (error) {
            console.error(`❌ Failed to update ${roleName}:`, error.message);
          }
        }
      }
    }
  }, 1000);

  console.log('✅ Founder RGB animation started successfully!');
}

module.exports = { startFounderRgbAnimation };
