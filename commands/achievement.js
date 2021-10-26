const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage } = require('node-canvas');
const { join } = require('path');

// To do before launch
// 1. Ask permission from nemu to use her minecraft skin as the icon
// 2. Manage permissions (do we allow all users to use this command or just some people with certain roles)

const command = new SlashCommandBuilder()
.setName('achievement')
.setDescription('Generate your own Minecraft Achievement.')
.addStringOption(option => option
  .setName('description')
  .setDescription('Description of the achievement. Max 25 characters.')
  .setRequired(true)
)
.addStringOption(option => option
  .setName('title')
  .setDescription('Title of the achievement. Max 25 characters.')
)
.addUserOption(option => option
  .setName('target')
  .setDescription('The user who achieved this achievement')
);

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const title = (interaction.options.getString('title') || 'Achievement Get!').substr(0,25).replace(/\s/g, '  ');
    const descr = interaction.options.getString('description').substr(0,25).replace(/\s/g, '  ');
    const target = interaction.options.getUser('target');
    /**NOTE REGARDING THE REPLACE FN: Minecraftia font's "space width" is less than Minecraft's so we have to double them up*/
    const title_rgb = 'rgb(255,255,0)';    // Yellow
    const descr_rgb = 'rgb(255,255,255)';  // White

    // Constructor
    const bglength = getBGLength(descr,title)
    const side = await loadImage(join(__dirname, '..', 'assets', 'images', 'minecraft', 'minecraft_achievement_side.png'));
    const middle = await loadImage(join(__dirname, '..', 'assets', 'images', 'minecraft', 'minecraft_achievement_middle.png'));
    const nemu = await loadImage(join(__dirname, '..', 'assets', 'images', 'minecraft', 'nemu_minecraft_icon.png'));
    const canvas = createCanvas(bglength + 24 /*12 pixels each sides for side constructor*/, 64);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(side,0,0); // Origin set at coordinates 0,0
    ctx.drawImage(middle,12,0, bglength, 64); // Stretch dat image

    ctx.save();
    ctx.rotate(Math.PI); // Rotate 180 deg
    ctx.drawImage(side,-canvas.width,-canvas.height); // Place the next side on the other end of the canvas
    ctx.restore();
    ctx.drawImage(nemu, 16, 16);

    ctx.font = '16px Minecraftia, "Code2003", "Unifont"';
    ctx.fillStyle = 'rgb(255,255,0)';
    ctx.fillText(title, 60, 38, bglength);
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillText(descr, 60, 60, bglength);

    const success = `Successfully generated Minecraft Achievement: **${title}!**`;
    const fail = (e) => `Unable to generate Minecraft Achievement: ${e.message}`;

    return interaction.channel.send({ content: target ? `${target}, You got an achievement!` : 'Achievement Get!' , files: [{
      attachment: canvas.toBuffer(),
      name: `achievement_nemudroid.png`
    }]})
    .then(() =>  interaction.reply({ content: success, ephemeral: true }))
    .catch(e => interaction.reply({ content: fail(e), ephemeral: true }));
  }
};

function getBGLength(descr, title){
  const canvas = createCanvas(100,14);
  const ctx = canvas.getContext('2d');
  ctx.font = '12px Minecraftia, "Code2003", "Unifont"';
  const dwidth = ctx.measureText(descr).width;
  const twidth = ctx.measureText(title).width;
  const width  = dwidth > twidth ? dwidth : twidth; // If dwidth is greater than twidth, use dwith, otherwise, use twidth;
  return (width < 250 ? 250 : width) + 54; // add 54 to give space to the icon w/c is 54x54
};
