'use strict';

const { createCanvas, loadImage } = require('node-canvas');
const { join } = require('path');
const uModel = require('../models/userSchema.js');
const _ = require('lodash');

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
    const avatarURL = user.displayAvatarURL({ format: 'png' });

    const gender = member.roles.cache.find(role => ['male', 'female'].includes(role.name.toLowerCase()))?.name.toLowerCase() || 'unspecified';

    const uDocument = await uModel.findByIdOrCreate(user.id);
    if (uDocument instanceof Error){
        return;
    };

    const wallpaperURL = uDocument.wallpaper;

    const canvas = createCanvas(650, 500);
    const ctx = canvas.getContext('2d');
    const template = await loadImage(join(imagePath, `level-${profile}-template.png`));
    const wallpaper = wallpaperURL ? await loadImage(wallpaperURL).catch(() => {}) : null;
    const avatar = await loadImage(avatarURL);
    const captchaIcon = await loadImage(join(imagePath, 'icon-games-captcha.png'));
    const coinflipIcon = await loadImage(join(imagePath, 'icon-games-coinflip.png'));
    const hangmanIcon = await loadImage(join(imagePath, 'icon-games-hangman.png'));
    const minesweeperIcon = await loadImage(join(imagePath, 'icon-games-minesweeper.png'));
    const rpsIcon = await loadImage(join(imagePath, 'icon-games-rps.png'));
    const tictactoeIcon = await loadImage(join(imagePath, 'icon-games-tictactoe.png'));
    const icons = _.chunk([captchaIcon, coinflipIcon, hangmanIcon, minesweeperIcon, rpsIcon, tictactoeIcon ], 3);

    function changedLogoColor(logo, color){
        const sCanvas = createCanvas(40, 40);
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = color;
        sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
        sCtx.globalCompositeOperation = 'destination-in';
        sCtx.drawImage(logo, 0, 0, sCanvas.width, sCanvas.height);
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

    ctx.fillStyle = colors.fontPrimary;
    ctx.font = 'bold 45px Whitney Bold, "Code2003", "Unifont"'
    ctx.fillText(nickname, 56, 290);

    for (const [parentIndex, iconGroup] of icons.entries()){
        const border = 56;
        const text = _.chunk(Object.values(uDocument.getGameData()), 3);
        const cellWidth = (canvas.width - border * 2) / 3;
        for (const [childIndex, icon] of iconGroup.entries()){
            const width = () => border + (cellWidth * childIndex);
            const height = () => 315 + 90 * parentIndex;

            ctx.drawImage(changedLogoColor(icon, text[parentIndex][childIndex].color), width(), height());
            ctx.fillStyle = colors.fontPrimary;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.font = '15px Whitney Book';

            ctx.fillText(text[parentIndex][childIndex].name.toUpperCase(), width() + icon.width - 10, height() + 12);
            ctx.strokeText(text[parentIndex][childIndex].name.toUpperCase(), width() + icon.width - 10, height() + 12);
            ctx.fillStyle = colors.fontSecondary;
            Object.entries(text[parentIndex][childIndex]).filter(([k,v]) => !['name', 'played', 'color'].includes(k)).filter(([k,v]) => v !== null).forEach(([k, v], index) => {
              if (k == 'winRate') v = (100 * v).toFixed() + '%';
              if (k == 'meanScore') v = v.toFixed(2);
              ctx.fillText(`${k.toUpperCase().split('SCORE').join('')}: ${v}`, width() + icon.width - 10, height() + 30 + (index * 15));
            });
        };
    };
    return canvas.toBuffer();
};
