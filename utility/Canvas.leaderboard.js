'use strict';

const { MessageAttachment } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = async (collection, pageIndex) => {
    const images = [];

    for (const [index, data] of Object.entries(collection)){
        const canvas = createCanvas(600,100);
        const ctx = canvas.getContext('2d');
        const avatar = await loadImage(data.avatarURL);

        const xp_current = data.xp - cap(data.level - 1);
        const xp_limit   = cap(data.level) - cap(data.level - 1);
        const xp_percent = xp_current / xp_limit;

        const primaryColor   = pageIndex === 0 ? ['rgb(212,175,55)','rgb(192,192,192)','rgb(205,127,50)'][index] || '#A9A9A9' : '#A9A9A9';
        const secondaryColor = 'rgb(54,54,54)';
        const header1 = 'bold 35px Minecraftia';
        const header2 = 'bold 25px Minecraftia';
        const header3 = '15px Minecraftia';

        function placeText(text, x, y){
            ctx.beginPath();
            ctx.moveTo(x - ctx.measureText(text).width / 2, y);
            ctx.lineTo(x + ctx.measureText(text).width / 2, y);
            ctx.lineWidth = 18;
            ctx.lineCap = 'round';
            ctx.strokeStyle = primaryColor;
            ctx.stroke();
            ctx.fillStyle = secondaryColor;
            ctx.textAlign = 'center';
            ctx.fillText(text, x, y + 16);
        };

        function placeVerticalLine(x, y, height, color = primaryColor){
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + height);
            ctx.lineCap = 'square';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        function generateXPBar(x, y, width, percent){
            ctx.lineCap = 'butt';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arcTo(x, y - 6, x + 6, y - 6, 6);
            ctx.lineTo(x + width - 6, y - 6);
            ctx.arcTo(x + width, y - 6, x + width, y, 6);
            ctx.arcTo(x + width, y + 6, x + width - 6, y + 6, 6);
            ctx.lineTo(x + 6, y + 6);
            ctx.arcTo(x, y + 6, x, y, 6);
            ctx.stroke();
            ctx.save();
            ctx.clip();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (width * xp_percent), y);
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.restore();
        };

        function generateXPDialogue(x, y, xp, cap){
            ctx.font        = '10px Minecraftia';
            const { actualBoundingBoxAscent, actualBoundingBoxDescent, width } = ctx.measureText(cap);

            ctx.strokeStyle = primaryColor;
            ctx.fillStyle   = primaryColor;

            ctx.beginPath();
            ctx.moveTo(x + 4, y - (actualBoundingBoxAscent + 4));
            ctx.lineTo(x - (width + 16), y - (actualBoundingBoxAscent + 4));
            ctx.lineTo(x - (width + 16), y + (actualBoundingBoxDescent + 4));
            ctx.lineTo(x, y + (actualBoundingBoxDescent + 4));
            ctx.stroke();

            ctx.textAlign = 'right';
            ctx.fillText(xp, x - 8, y);

            ctx.beginPath();
            ctx.moveTo(x + 4, y - (actualBoundingBoxAscent + 4));
            ctx.lineTo(x + (width + 16), y - (actualBoundingBoxAscent + 4));
            ctx.lineTo(x + (width + 16), y + (actualBoundingBoxDescent + 4));
            ctx.lineTo(x - 4, y + (actualBoundingBoxDescent + 4));
            ctx.stroke();
            ctx.fill();

            ctx.textAlign = 'left';
            ctx.fillStyle = secondaryColor;
            ctx.fillText(cap, x + 8, y)
            ctx.stroke();
        };

        ctx.arc(80,50,40,0,Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = primaryColor;
        ctx.stroke();
        ctx.save();
        ctx.clip();
        ctx.drawImage(avatar,40,10,80,80);
        ctx.restore();

        ctx.beginPath();
        ctx.textAlign = 'center';
        ctx.font = header1;
        ctx.fillStyle = primaryColor;
        ctx.fillText(ordinalize(Number(pageIndex === 0 ? index : Number(pageIndex) * 10 + Number(index) ) + 1), 220, 72);
        ctx.font = header3;
        placeText('RANKED', 220, 70);
        placeVerticalLine(280, 20, 60);

        ctx.beginPath();
        ctx.moveTo();

        generateXPBar(300, 28, 160, xp_percent);
        generateXPDialogue(380, 53, splitNumber(xp_current), splitNumber(xp_limit))
        ctx.font = header3;
        placeText('EXP', 380, 70);
        placeVerticalLine(480, 20, 60);

        ctx.beginPath();
        ctx.font = header1;
        ctx.textAlign = 'center'
        ctx.fillStyle = primaryColor;
        ctx.fillText(data.level, 540, 72);
        ctx.font = header3
        placeText('LEVEL', 540, 70);

        images.push(new MessageAttachment(
            canvas.toBuffer(),
            `lb-${data.id}.png`
        ));
    };

    return images;
};

function ordinalize(n = 0){
  return Number(n)+[,'st','nd','rd'][n/10%10^1&&n%10]||Number(n)+'th';
};

function splitNumber(number){
  return Number(number || '').toLocaleString('en-US', { maximumFractionDigits: 0 });
};

function cap(level){
    return 50 * Math.pow(level, 2) + 250 * level;
};
