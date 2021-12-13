'use strict';

const { Collection } = require('discord.js');
const { createCanvas } = require('canvas');
const { checkDuplicateInstance, removeInstance } = require('./_Games.util.js');
const { basename } = require('path');
const model = require('../../models/userSchema.js');
const moment = require('moment');
const _ = require('lodash');

module.exports = async function(interaction){

    const isNotDuplicate = await checkDuplicateInstance(
        interaction,
        basename(__filename, '.js')
    );

    if (!isNotDuplicate) return;

    // const gameCache = interaction.client.localCache.games
    //         .get('captcha') ||
    //     interaction.client.localCache.games
    //         .set('captcha', new Collection())
    //         .get('captcha');
    //
    // const timestamp = gameCache.get(interaction.user.id);
    //
    // if (timestamp + 144e5 > Date.now())
    //     return interaction.reply({
    //         ephemeral: true,
    //         content: `I am still preparing your new set of CAPTCHAs. Please come back again ${moment(timestamp + 144e5).fromNow()}.`
    //     });


    const char = String.fromCharCode(...Array(123).keys()).replace(/[\W1]/g,'');
    const code = (length) => _.sampleSize(char, length).join('');
    let attempts = 0;
    let length = 5;
    let codeText = code(length);
    let credits = 15;
    let incorrectCode = false;

    function generateCode(){
        const canvas = createCanvas(150, 50);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#27292b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.font      = 'bold 20px Old Typewriter';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(codeText, 75, 35, 140);

        return canvas.toBuffer();
    };

    await interaction.reply({
        content: 'Type the characters below in under 15 seconds!',
        files: [{
            attachment: generateCode(),
            name: 'nemucaptcha.png'
        }]
    });

    const collector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === interaction.user.id,
        time: 15000
    });

    collector
    .on('collect', message => {
        if (message.content !== codeText){
            incorrectCode = true;
            return collector.stop();
        };

        credits += 7;
        length ++;
        attempts ++;
        codeText = code(length);

        collector.resetTimer({
            time: 15000
        });

        return interaction.followUp({
            content: `> *Correct Attempts: x${attempts}*`,
            files: [{
                attachment: generateCode(),
                name: 'nemucaptcha.png'
            }]
        });
    })
    .on('end', async () => {

        const profile = await model
            .findById(interaction.user.id)
            .catch(e => e)

        if (profile instanceof Error)
            return interaction.followUp({
                ephemeral: true,
                content: `❌ Error ${profile.message}`
            });

        profile.credits += credits;
        profile.gamestats.captcha.games_played++

        if (attempts > profile.gamestats.captcha.high_score)
            profile.gamestats.captcha.high_score = attempts;

        let content;
        if (incorrectCode){
            content = `❌ You typed the wrong code! The code is **${codeText}**.\n`
        } else {
            content = `⌛ You ran out of time! The code is **${codeText}**.\n`
        };

        return profile
        .save()
        .then(() => {
            // gameCache.set(interaction.user.id, Date.now())
            return interaction.followUp({
                content: content + `⚔️ This challenge has ended! You earned a total of <a:coin:907310108550266970> **${credits}** credits! (${attempts} correct attempts!)`
            });
        })
        .catch(e => interaction.followUp({
            ephemeral: true,
            content: `❌ Error: ${e.message}`
        }))
        .finally(() => removeInstance(interaction, basename(__filename, '.js')));
        ;
    });
};
