const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage } = require('node-canvas');
const { join } = require('path');

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

        let title = interaction.options.getString('title');
        let descr = interaction.options.getString('description');
        const target = interaction.options.getUser('target');

        if (!title)
            title = 'Achievement Get!';

        if (title.length > 25)
            title = title.substr(0, 25);

        if (descr.length > 25)
            descr = descr.substr(0, 25);

        descr = descr.replace(/\s/g, '  ');

        const title_rgb = 'rgb(255,255,0)';
        const descr_rgb = 'rgb(255,255,255)';

        const __minecraft = '../assets/images/minecraft/';

        const bglength = getBGLength(descr, title);
        const side     = await loadImage(join(__dirname, __minecraft, 'minecraft_achievement_side.png'));
        const middle   = await loadImage(join(__dirname, __minecraft, 'minecraft_achievement_middle.png'));
        const nemu     = await loadImage(join(__dirname, __minecraft, 'nemu_minecraft_icon.png'));

        const canvas = createCanvas(bglength + 24, 64);
        const ctx    = canvas.getContext('2d');

        ctx.drawImage(side, 0, 0);
        ctx.drawImage(middle, 12, 0, bglength, 64);

        ctx.save();
        ctx.rotate(Math.PI);
        ctx.drawImage(side, -canvas.width, -canvas.height);
        ctx.restore();
        ctx.drawImage(nemu, 16, 16);

        ctx.font = '16px Minecraftia';
        ctx.fillStyle = title_rgb;
        ctx.fillText(title, 60, 38, bglength);
        ctx.fillStyle = descr_rgb;
        ctx.fillText(descr, 60, 60, bglength);

        return interaction.channel.send({
            content: target
                ? `${target}, You got an achievement!`
                : 'Achievement Get!',
            files: [{
                attachment: canvas.toBuffer(),
                name: 'achievement_nemudroid.png'
            }]
        }).then(() => interaction.reply({
            content: `Successfully generated Minecraft Achievement: **${title}**`,
            ephemeral: true
        })).catch(e => interaction.reply({
            content: `Unable to generate Minecraft Achievement: ${e.message}`,
            ephemeral: true
        }));
    }
};

function getBGLength(descr, title){
    const canvas = createCanvas(100,14);
    const ctx = canvas.getContext('2d');
    ctx.font = '16px Minecraftia, "Code2003", "Unifont"';
    const dwidth = ctx.measureText(descr).width;
    const twidth = ctx.measureText(title).width;
    const width  = dwidth > twidth ? dwidth : twidth; // If dwidth is greater than twidth, use dwith, otherwise, use twidth;
    return (width < 250 ? 250 : width) + 54; // add 54 to give space to the icon w/c is 54x54
};
