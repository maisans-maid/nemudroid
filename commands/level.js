const { SlashCommandBuilder } = require('@discordjs/builders');
const model = require('../models/userSchema.js');
const { loadImage, createCanvas } = require('node-canvas');
const { join } = require('path');

const command = new SlashCommandBuilder()
.setName('level')
.setDescription('Check your (or someone else\'s) level')
.addUserOption(option => option
  .setName('user')
  .setDescription('View this user\'s level')
);

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const user = interaction.options.getUser('user') || interaction.user;

    if (user.bot) return interaction.reply({ ephemeral: true, content: 'Bots cannot earn xp!' });

    const subdocument_template = { _id: user.id, xp: [{ xp: 0, id: interaction.guild.id, level: 1 }]};

    const timeout = setTimeout(() => !interaction.replied ? interaction.deferReply() : null, 2000);

    let collection = await model.find({ 'xp.id': interaction.guildId }, { 'xp.$': 1, '_id': 1, 'wallpaper': 1 });
    if (!collection.length)
        collection = [ subdocument_template ];
    if (!collection.find(x => x._id === user.id));
        collection.push(subdocument_template);

    const document = collection.find(x => x._id === user.id);
    const subdocument = document.xp[0];

    const member = await interaction.guild.members.fetch(user.id).catch(e => e);
    if (member instanceof Error) return interaction[interaction.deferred ? 'editReply' : 'reply']({ ephemeral: true, content: member.message });
    const emojis = { PLAYING: '🎮', LISTENING: '🔈', STREAMING: '📺', COMPETING: '⚔️', WATCHING: '📺' }
    const presence = member.presence?.activities.filter(x => x.type !== 'CUSTOM').splice(0,1).map(x => `${emojis[x.type]} ${x.type[0]}${x.type.substr(1,10).toLowerCase()} ${x.name}`)[0];
    const isNemu = user.id === '753150492380495894';
    const isMod = member.permissions.has('MANAGE_GUILD');

    const canvas = createCanvas(315,560);
    const ctx = canvas.getContext('2d');
    let wallpaper; try { wallpaper = await loadImage(document.wallpaper || '') } catch (e) { console.log(e) };
    const avatar = await loadImage(user.displayAvatarURL({ size: 512, format: 'png', dynamic: false }));
    const checkbox = await loadImage(join(__dirname, '../assets/images/icon/checkbox.png'));
    const nemuicon = await loadImage(join(__dirname, '../assets/images/icon/nemu-icon-1.png'));

    ctx.beginPath();
    ctx.fillStyle = 'rgb(48,52,78)';
    createRoundedRect(0,0,canvas.width,canvas.height,8);
    ctx.clip();
    ctx.fill();

    // Wallpaper must be 315x140 or in the same aspect ratio, or the image will be cut
    if (wallpaper){
      ctx.drawImage(wallpaper, 0, 0, canvas.width, canvas.height * 0.25, 0, 0, canvas.width, canvas.height * 0.25);
    } else {
      ctx.fillStyle = '#acacac';
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.25);
    };

    ctx.beginPath();
    const avatarRadius = 50
    ctx.arc(canvas.width / 2, canvas.height * 0.2, avatarRadius, 0, Math.PI * 2);
    ctx.shadowColor = 'rgb(0,0,0,0.4)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.drawImage(avatar, (canvas.width / 2) - avatarRadius,  (canvas.height * 0.2) - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
    ctx.shadowColor = 'rgba(0,0,0,0)';

    createVerifiedBadge( (canvas.width / 2) + avatarRadius * 0.8, (canvas.height * 0.2) + avatarRadius * 0.6, avatarRadius * 0.24 );

    if (isMod || isNemu){
        const tag = isNemu ? 'GOD' : 'MOD';
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineWidth = 20;
        ctx.font = '15px Aller';
        ctx.fillStyle = '#FFFFFF';
        ctx.moveTo(canvas.width, 140);
        ctx.lineTo(canvas.width - (ctx.measureText(tag).width + 10), 140);
        ctx.strokeStyle = isNemu ? '#f79245' : 'rgb(237, 66, 69)'
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(tag, canvas.width - 10, 146)
    };


    ctx.font = 'bold 30px Aller, "Segoe UI", "Unifont"';
    ctx.textAlign = "center";
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillText(member.displayName, canvas.width / 2, canvas.height * 0.38, canvas.width - 20);
    centerText(
      user.username, '18px Aller, "Segoe UI", "Unifont"', 'rgb(125,128,151)',
      '#' + user.discriminator, '15px Aller', 'rgb(126,148,223)',
      canvas.height * 0.42, canvas
    );

    if (presence){
      ctx.font = '15px "Segoe UI", "Segoe UI Emoji", "Unifont"';
      ctx.fillStyle = 'rgb(125,128,151)';
      ctx.textAlign = 'center';
      ctx.fillText(presence, canvas.width / 2, canvas.height * 0.50, canvas.width - 20);
    };

    createLineGradient(30, canvas.height * 0.55, canvas.width - 30, canvas.height * 0.55);

    // Details
    const xp_current = subdocument.xp - cap(subdocument.level - 1);
    const xp_currmax = cap(subdocument.level) - cap(subdocument.level - 1);
    const xp_percent = xp_current / xp_currmax;
    const xpgradient = gradientStyle(30, 370, canvas.width - 30, 370);
    createProgressBar(30, 370, canvas.width - 60, 15, xp_percent, xpgradient);
    centerText(
      xp_current.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 }), '25px Aller', xpgradient,
      '/' + xp_currmax.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 }), '15px Segoe UI', 'rgb(125,128,151)',
      400
    );

    createLineGradient(canvas.width / 2, 420, canvas.width / 2, canvas.height - 65);

    ctx.textAlign = 'center';
    // Level Number
    ctx.font = '65px Aller';
    const { width: levelwidth, actualBoundingBoxAscent: levelAscent, actualBoundingBoxDescent: levelDescent } = ctx.measureText(subdocument.level)
    ctx.fillStyle = gradientStyle((canvas.width * 0.25) - (levelwidth/2), 480 - levelAscent, (canvas.width * 0.25) + (levelwidth/2), 480 - levelAscent);
    ctx.fillText(subdocument.level, canvas.width * 0.25, 480);

    // Level Label
    ctx.font = '15px Aller';
    ctx.fillStyle = 'rgb(125,128,151)';
    ctx.fillText('LEVEL', canvas.width * 0.25, 500);

    // Rank Number
    ctx.font = '25px Aller';
    const rank = ordinalize(collection.sort((A,B) => B.xp[0].xp - A.xp[0].xp).findIndex(x => x._id === user.id) + 1);
    const { width: rankwidth, actualBoundingBoxAscent: rankAscent, actualBoundingBoxDescent: rankDescent } = ctx.measureText(rank);
    ctx.fillStyle = gradientStyle((canvas.width * 0.75) - (rankwidth/2), 460 - rankAscent, (canvas.width * 0.75) + (rankwidth/2), 460 - rankAscent);
    ctx.fillText(rank, canvas.width * 0.75, 460);

    // Rank Label
    ctx.font = '15px Aller';
    ctx.fillStyle = 'rgb(125,128,151)';
    ctx.fillText('RANK', canvas.width * 0.75, 480);

    ctx.fillStyle = gradientStyle(0, canvas.height - 20, canvas.width, canvas.height - 20);
    ctx.fillRect(0, canvas.height - 40, canvas.width, canvas.height);

    ctx.drawImage(nemuicon, (canvas.width / 2) - 40, canvas.height - 70, 80, 60)

    /*Canvas Functions*/
    function centerText(textA, textAfont, textAstyle, textB, textBfont, textBstyle, y){ ctx.font=textAfont;const{width:aWidth}=ctx.measureText(textA);ctx.font=textBfont;const{width:bWidth}=ctx.measureText(textB);const totalWidth=aWidth+bWidth;ctx.font=textAfont;ctx.fillStyle=textAstyle;ctx.textAlign='left';ctx.fillText(textA,(canvas.width/2)-(totalWidth/2),y);ctx.font=textBfont;ctx.fillStyle=textBstyle;ctx.textAlign='right';ctx.fillText(textB,(canvas.width/2)+(totalWidth/2),y);};
    function gradientStyle(x1,y1,x2,y2,c1='rgb(126,99,214)',c2='rgb(206,74,162)'){ctx.beginPath();const gradient=ctx.createLinearGradient(x1,y1,x2,y2);gradient.addColorStop(0,c1);gradient.addColorStop(1,c2);return gradient;};
    function createLineGradient(x1, y1, x2, y2, c1, c2, width = 1){ctx.strokeStyle=gradientStyle(x1,y1,x2,y2,c1,c2);ctx.lineWidth=width;ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);ctx.stroke();};
    function createRoundedRect(x1, y1, x2, y2, radius = 8){ctx.beginPath();ctx.moveTo(x1,radius);ctx.arcTo(x1,y1,x1+radius,y1,radius);ctx.lineTo(x2-radius,y1);ctx.arcTo(x2,y1,x2,radius,radius);ctx.lineTo(x2,y2-radius);ctx.arcTo(x2,y2,x2-radius,y2,radius);ctx.lineTo(radius,y2);ctx.arcTo(x1,y2,x1,y2-radius,radius);ctx.closePath();};
    function createProgressBar(x, y, width, height, percent, style){
      ctx.beginPath();
      ctx.lineCap='butt';
      ctx.lineWidth=2;
      ctx.strokeStyle=style;
      ctx.moveTo(x,y);
      ctx.arcTo(x,y-(height/2),x+(height/2),y-(height/2),height/2);
      ctx.lineTo(x+width-(height/2),y-height/2);
      ctx.arcTo(x+width,y-(height/2),x+width,y,height/2);
      ctx.arcTo(x+width,y+(height/2),x+width-(height/2),y+(height/2),height/2);
      ctx.lineTo(x+(height/2),y+(height/2));
      ctx.arcTo(x,y+(height/2),x,y,height/2);
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.lineWidth=height;
      ctx.moveTo(x,y);
      ctx.lineTo(x+(width*percent),y);
      ctx.stroke();
      ctx.restore();
    };
    function createVerifiedBadge(x,y,radius){ctx.beginPath();ctx.shadowColor = 'rgba(0,0,0,0.5)';ctx.shadowOffsetY = 0;ctx.shadowBlur = 10;ctx.fillStyle = gradientStyle(x-radius,y,x+radius,y);ctx.arc(x,y,radius,0,Math.PI * 2);ctx.fill();ctx.drawImage(checkbox,x-radius,y-radius,radius*2,radius*2);ctx.shadowColor='rgba(0,0,0,0)'};

    /*Calculation and Parsing*/
    function ordinalize(n = 0){
      return Number(n)+[,'st','nd','rd'][n/10%10^1&&n%10]||Number(n)+'th';
    };
    function cap(level){
      return 50 * Math.pow(level, 2) + 250 * level;
    };

    return interaction[interaction.deferred ? 'editReply' : 'reply']({ files: [{ name: 'nemDroidCard.png', attachment: canvas.toBuffer() }] });
  }
};
