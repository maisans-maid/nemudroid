'use strict';

const { MessageEmbed } = require('discord.js')
const { createCanvas } = require('node-canvas');
const _ = require('lodash');
const uModel = require('../models/userSchema.js');
const generateNotificationEmbed = require('./tools/embed-version-1.js');

module.exports = async interaction => {
    const char = String.fromCharCode(...Array(123).keys()).replace(/[\W1]/g,'');
    const code = l => _.sampleSize(char, l).join('');
    let attempts = 0, length = 5, codeText = code(length), incorrectCode = false, content;
    const font = 'bold 20px Old Typewriter';

    const context = createCanvas(0,0).getContext('2d');
    context.font = font;
    const measureText = t => context.measureText(t);

    function generateCode(){
        const { width } = measureText(codeText)
        const canvas = createCanvas(width + 25, 50);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#27292b';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.textAlign = 'center';
        ctx.font = font;
        ctx.fillStyle = 'rgba(255,255,255,255,0.4)';
        ctx.fillText(codeText, canvas.width / 2, 35);

        return canvas.toBuffer();
    };

    await interaction.reply({
        content: 'Type the characters below in under 15 seconds!',
        files: [{
            attachment: generateCode(),
            name: 'nemuCaptcha.png'
        }]
    });

    const collector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === interaction.user.id,
        time: 15_000
    });

    collector.on('collect', message => {
        if (message.content !== codeText){
            incorrectCode = true;
            return collector.stop();
        };

        length++;
        attempts++;
        codeText = code(length);

        collector.resetTimer({ time: 15_000 });

        return interaction.followUp({
            content: `> *Correct Attempts: x${attempts}*`,
            files: [{
                attachment: generateCode(),
                name: 'nemuCaptcha.png'
            }]
        });
    });

    collector.on('end', async () => {
        const uDocument = await uModel.findByIdOrCreate(interaction.user.id).catch(e => e);
        if (uDocument instanceof Error) return interaction.followUp({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${uDocument.message})`
        });

        let embeds;

        const embed = await generateNotificationEmbed('captcha', attempts, interaction);
        if (embed) embeds = [embed];

        uDocument.gameStats.captcha.scores.push(attempts);
        if (incorrectCode){
            content = `❌ You typed the wrong code! The code is **${codeText}**.`
        } else {
            content = `⌛ You ran out of time! The code is **${codeText}**.`
        };
        return uDocument.save()
        .then(() => interaction.followUp({ embeds, content }))
        .catch(e => interaction.followUp({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${e.message})`
        }))
        .finally(() => interaction.client.custom.cache.games.get(interaction.guildId).delete(interaction.user.id));
    });
    return;
};

function ordinalize(n = 0){
    return Number(n)+[,'st','nd','rd'][n/10%10^1&&n%10]||Number(n)+'th';
};
