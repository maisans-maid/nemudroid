'use strict';

const { createCanvas, loadImage } = require('node-canvas');
const { join } = require('path');
const uModel = require('../models/userSchema.js');
const gModel = require('../models/guildSchema.js');

const colorProfile = {
    dark: {
        fontPrimary: '#FFFFFE',
        fontSecondary: '#ACADAE',
        bgPrimary: 'rgb(79, 83, 92)',
        red: 'rgb(255, 128, 128)',
        green: 'rgb(59, 165, 93)',
        orange: 'rgb(209, 166, 14)',
        blurple: 'rgb(88, 101, 242)',
        disabled: 'rgb(79, 83, 92)'
    },
    light: {
        fontPrimary: '#00000E',
        fontSecondary: '#00000E',
        bgPrimary: 'rgb(79, 83, 92)',
        red: 'rgb(255, 128, 128)',
        green: 'rgb(59, 165, 93)',
        orange: 'rgb(209, 166, 14)',
        blurple: 'rgb(88, 101, 242)',
        disabled: 'rgb(79, 83, 92)'
    }
};

module.exports = async options => {

    const imagePath = join(__dirname, '../assets', 'images');
    const profile = options.profile;
    const colors = colorProfile[profile];

    const user = options.member.user;
    const member = options.member;
    const { username, discriminator } = user;
    const { displayName: nickname } = member;
    const avatarURL = user.displayAvatarURL({ format: 'png', size: 256 });

    const gender = member.roles.cache.find(role => ['male', 'female'].includes(role.name.toLowerCase()))?.name.toLowerCase() || 'unspecified';
    const isModerator = member.permissions.has('MANAGE_GUILD');
    const muted = member.communicationDisabledUntil > Date.now();
    const onVC = member.voice.channel;
    const isPlaying = member.presence?.activities.some(a => a.type === 'PLAYING');

    const document = await uModel.findByIdOrCreate(user.id);
    if (document instanceof Error){
        return;
    };
    const gDocument = await gModel.findByIdOrCreate(options.guild.id);
    if (gDocument instanceof Error){
        return;
    };
    const isAFK = gDocument.afks.some(x => x.id === user.id);

    const wallpaperURL = document.wallpaper;
    const subdocument = document.getXP(options.guild.id);
    const level = subdocument.level;
    const xpCap = level > 1 ? document.getXPCap(options.guild.id, level - 1) : 0;
    const nextXpCap = document.getXPCap(options.guild.id);
    const xpCurrent = level > 1 ? subdocument.xp - xpCap : subdocument.xp;
    const roleReward = member.roles.cache
        .filter(r => gDocument.roles.rewards.some(x => x.role === r.id))
        .sort((A,B) => B.rawPosition - A.rawPosition)
        .first();

    const canvas = createCanvas(650, 500);
    const ctx = canvas.getContext('2d');
    const template = await loadImage(join(imagePath, `level-${profile}-template.png`));
    const wallpaper = wallpaperURL ? await loadImage(wallpaperURL).catch(() => {}) : null;
    const avatar = await loadImage(avatarURL);
    const genderIcon = await loadImage(join(imagePath, `icon-${gender.toLowerCase()}.png`));
    const mutedIcon = await loadImage(join(imagePath, 'icon-muted.png'));
    const vcIcon = await loadImage(join(imagePath, 'icon-vc.png'));
    const afkIcon = await loadImage(join(imagePath, 'icon-afk.png'));
    const playIcon = await loadImage(join(imagePath, 'icon-playing.png'));

    function addRoundedBorderToText(x, y, textMetrics){
        const xOffsetPrimary = ctx.textAlign === 'left' ? 0 : ctx.textAlign === 'center' ? textMetrics.width / 2 : textMetrics.width;
        const xOffsetSecondary = ctx.textAlign === 'right' ? 0 : ctx.textAlign === 'center' ? textMetrics.width / 2 : textMetrics.width;
        ctx.beginPath();
        ctx.arc(x - xOffsetPrimary, y - textMetrics.emHeightAscent / 4 - textMetrics.emHeightDescent / 2, textMetrics.actualBoundingBoxAscent, Math.PI + Math.PI / 2, Math.PI / 2, true);
        ctx.arc(x + xOffsetSecondary, y - textMetrics.emHeightAscent / 4 - textMetrics.emHeightDescent / 2, textMetrics.actualBoundingBoxAscent, Math.PI / 2, Math.PI + Math.PI / 2, true);
        ctx.closePath();
    };

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

    function changedLogoColor(logo, color){
        const sCanvas = createCanvas(40, 40);
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = color;
        sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
        sCtx.globalCompositeOperation = 'destination-in';
        sCtx.drawImage(logo, 0, 0, 40, 40);
        return sCanvas;
    };

    if (wallpaper){
        ctx.drawImage(wallpaper, 0, 0, canvas.width, canvas.width * wallpaper.height / wallpaper.width);
    } else {
        ctx.fillStyle = user.hexAccentColor || '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.arc(131, 168, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();
    ctx.drawImage(avatar, 56, 93, 150, 150);
    ctx.restore();
    ctx.drawImage(template, 0, 0);

    let badgeWidth = 0;
    if (roleReward){
        const y = 200;
        const x = canvas.width - 35;
        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = '17px Whitney Book';
        const textMetrics = ctx.measureText(roleReward.name);
        ctx.fillStyle = roleReward.hexColor;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.fillText(roleReward.name, x, y);
        addRoundedBorderToText(x, y, textMetrics);
        ctx.stroke();
        ctx.restore();
        badgeWidth = textMetrics.width + textMetrics.actualBoundingBoxAscent * 2 + 10;
    };

    ctx.save();
    ctx.font = '17px Whitney Book';
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.fontSecondary;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2;
    ctx.fillText(`LEVEL: ${level}`, canvas.width - 35 - badgeWidth, 200);
    addRoundedBorderToText(canvas.width - 35 - badgeWidth, 200, ctx.measureText(`LEVEL: ${level}`));
    ctx.stroke();
    ctx.restore();

    if (isModerator){
        ctx.save();
        ctx.font = '17px Whitney Book';
        const previousTextMetrics = ctx.measureText(`LEVEL: ${level}`);
        const previousBadgeWidth = previousTextMetrics.width + previousTextMetrics.actualBoundingBoxAscent * 2 + 10;
        ctx.textAlign = 'right';
        ctx.fillStyle = colors.red;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.fillText(`MODERATOR`, canvas.width - 35 - badgeWidth - previousBadgeWidth, 200);
        addRoundedBorderToText(canvas.width - 35 - badgeWidth - previousBadgeWidth, 200, ctx.measureText(`MODERATOR`));
        ctx.stroke();
        ctx.restore();
    };

    ctx.drawImage(genderIcon, 56, 252, 25, 25);

    ctx.font = 'bold 25px Whitney Bold, "Code2003", "Unifont"';
    ctx.fillStyle = colors.fontPrimary;
    const usernameLength = ctx.measureText(username).width;
    ctx.fillText(username, 56 + 29, 275);
    ctx.font = 'bold 45px Whitney Bold, "Code2003", "Unifont"'
    ctx.fillText(nickname, 56, 315);
    ctx.font = 'bold 20px Whitney Book, "Code2003", "Unifont"';
    ctx.fillStyle = colors.fontSecondary;
    ctx.fillText(`#${discriminator}`, 56 + 29 + usernameLength, 275);

    ctx.fillStyle = colors.bgPrimary;
    createRoundedRect(56, canvas.height - 75, canvas.width - 56 * 2, 50, 5);
    ctx.fill();

    ctx.save();
    const cellWidth = (canvas.width - 56 * 2) / 4;
    const logoStyles = {
        muted:  muted ? colors.red : colors.disabled,
        vc: onVC ? colors.green : colors.disabled,
        afk: isAFK ? colors.orange : colors.disabled,
        playing: isPlaying ? colors.blurple : colors.disabled
    };
    ctx.drawImage(changedLogoColor(mutedIcon, logoStyles.muted), 56 + cellWidth * 0 + cellWidth / 2 - 20, 345);
    ctx.drawImage(changedLogoColor(vcIcon, logoStyles.vc), 56 + cellWidth * 1 + cellWidth / 2 - 20, 345);
    ctx.drawImage(changedLogoColor(afkIcon, logoStyles.afk), 56 + cellWidth * 2 + cellWidth / 2 - 20, 345);
    ctx.drawImage(changedLogoColor(playIcon, logoStyles.playing), 56 + cellWidth * 3 + cellWidth / 2 - 20, 345);

    ctx.font = '15px Whitney Book';
    ctx.textAlign = 'center';
    ctx.fillStyle = logoStyles.muted;
    ctx.fillText('Muted', 56 + cellWidth * 0 + cellWidth / 2, 400);
    ctx.fillStyle = logoStyles.vc;
    ctx.fillText('On VC', 56 + cellWidth * 1 + cellWidth / 2, 400);
    ctx.fillStyle = logoStyles.afk;
    ctx.fillText('AFK', 56 + cellWidth * 2 + cellWidth / 2, 400);
    ctx.fillStyle = logoStyles.playing;
    ctx.fillText('Playing', 56 + cellWidth * 3 + cellWidth / 2, 400);
    ctx.restore();

    ctx.save();
    createRoundedRect(56, canvas.height - 75, canvas.width - 56 * 2, 50, 5);
    ctx.clip();
    ctx.fillStyle = roleReward ? roleReward.hexColor : 'rgb(255,247,125)';
    ctx.fillRect(56, canvas.height - 75, (xpCurrent / (nextXpCap - xpCap)) * (canvas.width - 56 * 2), 50);
    ctx.restore();
    ctx.textAlign = 'center';
    const pTextMetrics = ctx.measureText(`${(xpCurrent * 100 / (nextXpCap - xpCap)).toFixed(2)} %`);
    addRoundedBorderToText(canvas.width / 2, canvas.height - 42, pTextMetrics);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = colors.fontPrimary;
    ctx.font = '20px Whitney Book';
    ctx.fillText(`${(xpCurrent * 100 / (nextXpCap - xpCap)).toFixed(2)} %`, canvas.width / 2, canvas.height - 42);

    return canvas.toBuffer();
};
