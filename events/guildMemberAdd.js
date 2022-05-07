'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');

const { createCanvas, loadImage } = require('node-canvas');
const GIFEncoder = require('gifencoder');
const moment = require('moment');
const _ = require('lodash');

const model = require('../models/guildSchema')

module.exports = async (client, member) => {
    const guildDocument = await model.findByIdOrCreate(member.guild.id);
    if (guildDocument instanceof Error){
        return console.log(`GREETER: ${guildDocument.message}`);
    };
    const channel = member.guild.channels.cache.get(guildDocument.channels.welcome);
    if (!channel){
        return console.log('GREETER: INVALID_CHANNEL');
    };

    const buffers = [];
    const imagePath = join(__dirname, '..', 'assets', 'images');
    const wallpapers = readdirSync(join(imagePath, 'wallpapers'));
    const wallpaper = await loadImage(join(imagePath, 'wallpapers', wallpapers[_.random(0, wallpapers.length - 1)]));
    const icon = await loadImage(join(imagePath, 'icon', 'nemu-icon-1.png'));
    const avatar = await loadImage(member.user.displayAvatarURL({ format: 'png', size: 256 }));
    const content = modify(guildDocument.text.welcome?.substr(0,2000), member);

    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    const { width: cWidth, height: cHeight } = canvas;

    function createRoundedRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.arcTo(x+w, y,   x+w, y+h, r);
        ctx.arcTo(x+w, y+h, x,   y+h, r);
        ctx.arcTo(x,   y+h, x,   y,   r);
        ctx.arcTo(x,   y,   x+w, y,   r);
        ctx.closePath();
    };

    ctx.drawImage(wallpaper, 0, 0, 800, 500);
    createRoundedRect(30, 30, cWidth - 60, cHeight - 60, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fill();

    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgb(255,247,125)';
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.arcTo(30, 30, 60, 30, 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cWidth - 60, 30);
    ctx.arcTo(cWidth - 30, 30, cWidth - 30, 60, 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(150, 180, 90, 0, Math.PI * 2);
    ctx.lineWidth = 25;
    ctx.strokeStyle = "rgb(255,247,125)";
    ctx.stroke();
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.drawImage(avatar, 150-90, 180-90, 180, 180);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(30, 280)
    ctx.lineTo(cWidth - 30, 280)
    ctx.lineTo(cWidth - 30, 440)
    ctx.lineTo(30, 440)
    ctx.closePath();
    ctx.fillStyle = 'rgba(57,50,56, 0.9)'
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(30, 278);
    ctx.lineTo(cWidth - 30, 278)
    ctx.strokeStyle = 'rgb(255,247,125)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'box';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(30, 440);
    ctx.arcTo(30, 470, 60, 470, 30);
    ctx.lineTo(cWidth - 60, 470);
    ctx.arcTo(cWidth - 30, 470, cWidth - 30, 440, 30);
    ctx.closePath();
    ctx.fillStyle = 'rgb(255,247,125)';
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.font = '40px Nerko One Regular, "Hiragino Kaku", "Code2003", "Unifont"';
    ctx.strokeStyle = 'rgb(34,24,42)';
    ctx.lineWidth = 5;
    ctx.beginPath();

    ctx.strokeText(member.user.tag, cWidth / 2, 320, 650);
    ctx.fillText(member.user.tag, cWidth / 2, 320, 650);

    ctx.save();
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(icon, cWidth - 195, 350, 200, 150);
    ctx.restore();

    ctx.font = '25px Segoe UI, "Segoe UI Emoji"';
    ctx.fillText('🥕 has fallen into Nemusagi\'s Rabbit Hole! 🥕', cWidth / 2, 355, 650);

    ctx.fillStyle = 'rgb(255,247,125)';
    ctx.font = '40px Nerko One Regular';

    const nthMember = `${ordinalize(member.guild.memberCount)} Member`;
    const nthWidth = ctx.measureText(nthMember).width;

    ctx.beginPath();
    ctx.moveTo((cWidth/2) - nthWidth/2, 433);
    ctx.lineTo((cWidth/2) + nthWidth/2, 433);
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

    ctx.strokeText(nthMember, cWidth / 2, 445, 650);
    ctx.fillText(nthMember, cWidth / 2, 445, 650);

    const encoder = new GIFEncoder(cWidth, cHeight);

    encoder.createReadStream()
        .on('data', buffer => buffers.push(buffer))
        .on('end', () => channel.send({
            content,
            files: [{
                name: 'welcome_nemdroid.gif',
                attachment: Buffer.concat(buffers)
            }]
        }));

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(100);

    for (const image of readdirSync(join(imagePath, 'chibi', 'frames'))){
        const sCanvas = createCanvas(cWidth, cHeight);
        const sCtx = sCanvas.getContext('2d');
        const frame = await loadImage(join(imagePath, 'chibi', 'frames', image));

        sCtx.drawImage(canvas, 0, 0);
        sCtx.drawImage(frame, cWidth - cWidth / 3, cHeight / 2 - 235, 270, 270);

        encoder.addFrame(sCtx);
    };

    encoder.finish();
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
    "{memberCountOrdinalized}": ordinalize(member.guild.memberCount)            // the number of users in ordinalized format (1st, 11th, 23rd, etc.)
  };
  return typeof str === 'string'
      ? str.replace(new RegExp(
              Object.keys(modifiers).join('|'),
              'g'
        ), word => modifiers[word] || word)
      : str;
};
