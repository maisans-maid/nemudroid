'use strict';

const { createCanvas, loadImage } = require('node-canvas');
const { join } = require('path');
const { readdirSync } = require('fs');
const wallpapers = readdirSync(join(__dirname, '..', 'assets', 'images', 'nbabgs')).map(x => x.split('.png')[0].split(',').map((n,i) => i < 2 ? Number(n) : n));

module.exports = async uDocument => {
    const canvas = createCanvas(600, 500);
    const ctx = canvas.getContext('2d');

    const imageDir = join(__dirname, '..', 'assets', 'images');
    const mainBG = await loadImage(join(imageDir, 'nemus-bizzare-adventure-bg.png'));
    const dice = await loadImage(join(imageDir, 'icon-die.png'));
    const chara = await loadImage(join(imageDir, 'nemu_chibi_new.png'));
    const { towerLevel, floorTile } = uDocument.nemusBizzareAdventure.getBasicInfo();
    const diceOwned = uDocument.nemusBizzareAdventure.diceOwned();
    const dungeon = wallpapers.find(([min, max]) => towerLevel >= min && towerLevel <= max);
    const wallpaper = await loadImage(join(imageDir, 'nbabgs', `${dungeon.join()}.png`));

    function changedLogoColor(logo, color){
        const sCanvas = createCanvas(32, 32);
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = color;
        sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
        sCtx.globalCompositeOperation = 'destination-in';
        sCtx.drawImage(logo, 0, 0, sCanvas.width, sCanvas.height);
        return sCanvas;
    };

    // These coordinates are manually tracked on a 71x100 img
    const charaPos = [
      [280, 355],
      [220, 312],
      [166, 268],
      [112, 230],
      [57, 191],
      [8, 130],
      [54, 95],
      [109, 48],
      [155, 5],
      [208, -31],
      [267, -82],
      [328, -26],
      [381, 15],
      [436, 52],
      [493, 97],
      [521, 136],
      [485, 197],
      [432, 232],
      [384, 280],
      [332, 322]
    ];

    ctx.drawImage(wallpaper, 0, 0);
    ctx.drawImage(mainBG, 0, 0);
    ctx.drawImage(chara, ...charaPos[floorTile], 71, 100);
    for (let i = 1; i <= 5; i++){
        ctx.drawImage(i > diceOwned ? changedLogoColor(dice, 'rgb(79,83,92)') : dice, 9 + 34 * (i - 1), 11, 32, 32);
    };

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgb(255,247,125)';
    ctx.fontStyle = 'rgb(255,255,255)';
    ctx.font = '12px Whitney Book';
    ctx.fillText('Dungeon', 425, 20);
    ctx.font = '16px Whitney Book';
    ctx.fillText(dungeon[2], 425, 45);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgb(255,247,125)';
    ctx.strokeStyle = 'rgb(34,24,42)';
    ctx.font = '90px Nerko One Regular';
    ctx.fillText(towerLevel, canvas.width / 2 + 5, canvas.height / 2 );
    ctx.strokeText(towerLevel, canvas.width / 2 + 5, canvas.height / 2);

    return canvas.toBuffer();
};
