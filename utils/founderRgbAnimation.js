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
  
  founderRoles.forEach((roleName, index) => {
    let hue = index * 120;
    
    setTimeout(() => {
      setInterval(async () => {
        hue = (hue + 10) % 360;
        const colorHex = hslToHex(hue, 100, 50);
        const colorInt = parseInt(colorHex.replace('#', ''), 16);

        for (const guild of client.guilds.cache.values()) {
          const role = guild.roles.cache.find(r => r.name === roleName);
          if (role) {
            try {
              await role.setColor(colorInt);
            } catch (error) {
              if (error.code === 50013) {
                console.error(`❌ Missing permissions for ${roleName}`);
              } else if (error.code === 429) {
                console.error(`⏱️ Rate limited on ${roleName} - waiting...`);
              }
            }
          }
        }
      }, 1000);
    }, index * 500);
  });

  console.log('✅ Founder RGB animation started successfully!');
  console.log('🚀 Fast RGB mode: Each role updates every 1 second with smooth color transitions');
}

module.exports = { startFounderRgbAnimation };
