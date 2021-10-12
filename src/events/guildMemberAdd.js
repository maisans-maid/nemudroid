const { createCanvas, loadImage } = require('node-canvas');
const { readdirSync } = require('fs');
const { join } = require('path');
const moment = require('moment');

module.exports = async (client, member) => {

  let profile = await client.database.models.guildSchema.findById(member.guild.id).catch(() => {});
  if (!profile){
    profile = new client.database.models.guildSchema({_id: member.guild.id});
  };
  if (profile instanceof Error){
    profile = client.localcache.serverprofiles[member.guild.id];
  };
  if (!profile){
    return;
  };

  const wallpaperDir = join(__dirname, '..', 'assets', 'images', 'welcomewallpapers')
  const wallpaperArr = readdirSync(wallpaperDir).filter(x => x.split('.').pop() === 'png');

  const channel = member.guild.channels.cache.get(profile.greeter.welcome.channel);
  const content = modify(profile.greeter.welcome.message.text?.substr(0,2000), member);
  const wallpaper = await loadImage(join(wallpaperDir, wallpaperArr[Math.floor(Math.random() * wallpaperArr.length)]));
  const avatar = await loadImage(member.user.displayAvatarURL({format: 'png', size: 512 }));

  if (!channel || !profile.greeter.welcome.isEnabled) return;

  const canvas = createCanvas(800,500);
  const ctx = canvas.getContext('2d');

  // Start

  ctx.drawImage(wallpaper, 0, 0, 800, 500);

  ctx.moveTo(60, 30)
  ctx.lineTo(canvas.width - 60, 30)
  ctx.arcTo(canvas.width - 30, 30, canvas.width - 30, 60, 30)
  ctx.lineTo(canvas.width - 30, canvas.height - 60)
  ctx.arcTo(canvas.width - 30, canvas.height - 30, canvas.width - 60, canvas.height - 30, 30)
  ctx.lineTo(60, canvas.height - 30)
  ctx.arcTo(30, canvas.height - 30, 30, canvas.height - 60, 30)
  ctx.lineTo(30, 60)
  ctx.arcTo(30, 30, 60, 30, 30)
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fill();


  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgb(255,247,125)';
  ctx.beginPath();
  ctx.moveTo(30, 60);
  ctx.arcTo(30,30,60,30,30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvas.width - 60, 30);
  ctx.arcTo(canvas.width - 30, 30, canvas.width - 30, 60, 30)
  ctx.stroke();

  // ctx.beginPath();
  // ctx.moveTo(30,278);
  // ctx.lineTo(canvas.width - 60, 30);
  // ctx.arcTo(canvas.width - 30, 30, canvas.width - 30, 60, 30);
  // ctx.lineTo(canvas.width - 30, 280);
  // ctx.closePath();
  // ctx.fillStyle = 'rgba(0,0,0,0.3)';
  // ctx.fill();

  // Avatar
  ctx.beginPath();
  ctx.arc(150, 180, 90, 0, Math.PI * 2);
  ctx.lineWidth = 25;
  ctx.strokeStyle = "rgb(255,247,125)";
  ctx.stroke();
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.drawImage(avatar, 150 - 90, 180 - 90, 180, 180)
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(30, 280)
  ctx.lineTo(canvas.width - 30, 280)
  ctx.lineTo(canvas.width - 30, 440)
  ctx.lineTo(30, 440)
  ctx.closePath();
  ctx.fillStyle = 'rgba(57,50,56, 0.9)'
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(30, 278);
  ctx.lineTo(canvas.width - 30, 278)
  ctx.strokeStyle = 'rgb(255,247,125)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'box';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(30,440);
  ctx.arcTo(30,470,60,470,30);
  ctx.lineTo(canvas.width-60, 470);
  ctx.arcTo(canvas.width-30,470,canvas.width-30,440,30);
  ctx.closePath();
  ctx.fillStyle = 'rgb(255,247,125)';
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.font = '40px Nerko One Regular, "Segoe UI", "Segoe UI Emoji", "Segoe UI Symbol", "Hiragino Kaku", "Code2003", "Unifont"';
  ctx.strokeStyle = 'rgb(34,24,42)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.strokeText(member.user.tag, canvas.width / 2, 320, 650)
  ctx.fillText(member.user.tag, canvas.width / 2, 320, 650)

  // Add nemu icon
  const icon = await loadImage(join(__dirname, '..', 'assets', 'images', 'nemu', 'nemu-icon-1.png'));
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(icon, canvas.width - 195 ,350 , 200, 150);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.font = '25px Segoe UI, "Segoe UI Emoji"';
  ctx.fillText('🥕 has fallen into Nemusagi\'s Rabbit Hole! 🥕', canvas.width / 2, 355, 650);


  // Add Member Rank
  ctx.fillStyle = 'rgb(255,247,125)'
  ctx.font = '40px Nerko One Regular';
  const nthMember = `${ordinalize(member.guild.memberCount)} Member`;
  const nthWidth = ctx.measureText(nthMember).width;
  ctx.beginPath();
  ctx.moveTo((canvas.width/2) - nthWidth/2, 433);
  ctx.lineTo((canvas.width/2) + nthWidth/2, 433);
  ctx.strokeStyle = 'rgb(255,255,255)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 40;
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgb(34,24,42)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.strokeText(nthMember, canvas.width / 2, 445, 650);
  ctx.beginPath();
  ctx.fillText(nthMember, canvas.width / 2, 445, 650);

  // Add nemu image
  const nemu = await loadImage(join(__dirname, '..', 'assets', 'images', 'nemu', 'nemu-chibi-1.png'));
  ctx.drawImage(nemu, canvas.width - (canvas.width / 3) , (canvas.height / 2) - 200 , 250, 250);


  // End

  channel.send({ content, files: [{
    attachment: canvas.toBuffer(),
    name: 'welcome_nemudroid.png'
  }]}).catch(console.error);

};

function ordinalize(n = 0){
  return Number(n)+[,'st','nd','rd'][n/10%10^1&&n%10]||Number(n)+'th';
};

function modify(str, member){
  const modifiers = {
    // User Based
    "{user}"                : member.user.toString(),     // Mention format of the newly joined user (@Sakurajimai)
    "{username}"            : member.user.username,       // The username of the newly joined user (Sakurajimai)
    "{tag}"                 : member.user.tag,            // The username and discriminator of the newly joined user (Sakurajimai#6742)
    "{discriminator}"       : member.user.discriminator,  // The discriminator of the newly joined user (6742)
    "{nickname}"            : member.displayName,         // The nickname of the newly joined user (Wen, [at most cases, this is default on initial server join])

    // User Display Avatar
    "{avatar}"              : member.user.displayAvatarURL(),                                  // If avatar is animated, use only a frame.
    "{avatarDynamic}"       : member.user.displayAvatarURL({ dynamic: true, format: 'png'}),   // Display the animated avatar if it is animated.

    // User Info
    "{createdAt}"           : member.user.createdAt,
    "{createdAtMDY}"        : moment(member.user.createdAt).format('dddd, MMMM D YYYY'),  // The date for which the user account was creadted in a human-readable format

    // Server Channels
    "{channelCount}"        : member.guild.channels.cache.size,                                     // Number of all channels (including voice and category)
    "{categoryChannelCount}": member.guild.channels.cache.filter( c => c.type === 'category').size, // Number of category channels
    "{textChannelCount}"    : member.guild.channels.cache.filter( c => c.type === 'text'    ).size, // Number of Text channels
    "{voiceChannelCount}"   : member.guild.channels.cache.filter( c => c.type === 'voice'   ).size, // Number of Voice channels

    // Server Info
    "{serverIcon}"           : member.guild.iconURL(),                               // Display a static icon even if server icon is animated
    "{serverIconDynamic}"    : member.guild.iconURL({dynamic: true, format: 'png'}), // Display animated icon if server icon is animated
    "{serverName}"           : member.guild.name,                                    // The name of the server
    "{memberCount}"          : member.guild.memberCount,                             // The number of users this server currently have
    "{memberCountOrdinalized}": ordinalize(member.guild.memberCount)                 // the number of users in ordinalized format (1st, 11th, 23rd, etc.)
  };

  return typeof str === 'string' ? str.replace(new RegExp(Object.keys(modifiers).join('|'), 'g'), word => modifiers[word] || word) : str;
};
