
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { join } = require('path');
const model = require('../models/userSchema.js');
const _ = require('lodash');

registerFont('./assets/fonts/Credit-Card-Font.ttf', { family: 'Credit Card Font' });

const createRoundedRect   = require('../util/canvas/createRoundedRect.js');
const createGradientStyle = require('../util/canvas/createGradientStyle.js');

const command = new SlashCommandBuilder()
.setName('balance')
.setDescription('Check your balance')

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const profile = await model
                .findById(interaction.user.id)
                .catch(e => e) ||
            new model({ _id: interaction.user.id });

        if (profile instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${profile.message}`
            });

        const timer = setTimeout(function(){
            if (!interaction.replied)
                interaction.deferReply();
        }, 2000);

        const canvas = createCanvas(600, 375);
        const ctx = canvas.getContext('2d');
        const card_id = await loadImage(join(__dirname, '../assets/images/creditcard/card-id.png'));
        const nemuicon = await loadImage(join(__dirname, '../assets/images/icon/nemu-icon-1.png'));

        ctx.beginPath();
        ctx.fillStyle = createGradientStyle(ctx, 0, 0, 600, 375, 'rgb(255,247,125)', 'rgb(89,69,60)');
        createRoundedRect(ctx, 0, 0, 600, 375, 25);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(canvas.width - 20, canvas.height / 2);
        ctx.lineTo(canvas.width - 50, (canvas.height / 2) - 30);
        ctx.lineTo(canvas.width - 50, (canvas.height / 2) + 30);
        ctx.closePath();
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fill();

        ctx.drawImage(card_id, 50, 30);

        ctx.drawImage(
            nemuicon,
            canvas.width - nemuicon.width,
            10,
            nemuicon.width * 0.75,
            nemuicon.height * 0.75
        );

        ctx.beginPath();
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = '24px Credit Card Font';
        ctx.textAlign = 'right';
        ctx.fillText('ID', canvas.width - 80, (canvas.height / 2) - 35)

        ctx.beginPath();
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.font = '24px Credit Card Font';
        ctx.textAlign = 'right';
        ctx.fillText(_.chunk(
            [...interaction.user.id], 4)
                .map(x => x.join(''))
                .join('  '),
            canvas.width - 80,
            (canvas.height / 2)
        );

        ctx.beginPath();
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = '20px Credit Card Font';
        ctx.textAlign = 'left';
        ctx.fillText(
            'NAME',
            40,
            canvas.height - 70
        );

        ctx.beginPath();
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.font = '30px Credit Card Font, "24px Code2003", "24px Unifont"';
        ctx.textAlign = 'left';
        ctx.fillText(
            interaction.user.username.toUpperCase(),
            40,
            canvas.height - 40
        );

        ctx.beginPath();
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = '20px Credit Card Font, "Code2003", "Unifont"';
        ctx.textAlign = 'left';
        ctx.fillText(
            'BALANCE',
            140,
            (canvas.height / 2) + 50
        );
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillText(
            profile.credits.toLocaleString('en-us'),
            140,
            (canvas.height / 2) + 80
        );
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillText(
            'STREAK',
            340,
            (canvas.height / 2) + 50
        );
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillText(
            profile.daily.currentstreak.toLocaleString('en-us'),
            340,
            (canvas.height / 2) + 80
        );

        return interaction[
            interaction.deferred
                ? 'editReply'
                : 'reply'
        ]({
            files: [{
                attachment: canvas.toBuffer(),
                name: 'nemu_credits.png'
            }]
        });
    }
};
