'use strict';

const uModel = require('../models/userSchema.js');
const gModel = require('../models/guildSchema.js');
const moment = require('moment');
const _ = require('lodash');

// NBA here refers to Nemu's bizzare adventure, not national basketball association
const generateNBAImage = require('../utility/Canvas.NBA.js');

module.exports = async interaction => {
    const ownerId = interaction.customId.split(':')[1];
    const action = interaction.customId.split(':').pop();

    if (action === 'ASK'){
        return interaction.reply({
            ephemeral: true,
            content: [
              'Main Objective: Roll the die and lead nemu to the next floor level!', '',
              'Each roll consumes one of your die, which will replenish every 30 minutes. The number of die you currently have is displayed in the upper left corner of the image. If you roll a die without one, you\'ll receive a message prompting you cannot roll a die, and a time at which you may reroll again', '',
              'The result of the die will determine which tile nemu will rest. It is added to the current tile where nemu belongs, and the sum is the tile where nemu will rest next.','',
              'There are various rewards on each tile, ranging from 5XP to 50XP. There are also tiles that will not give you xp, but instead give you a reroll (10) or advance you instantly to the next floor (5). However, there is also a tile that will bring you back to your previous floor level. (15)', '',
              'Try to reach the highest floor level among your friends (shown at the center)'
            ].join('\n')
        });
    };

    if (interaction.user.id !== ownerId) return interaction.reply({
        ephemeral: true,
        content: `⚔ You cannot control this interaction!`
    });

    const uDocument = await uModel.findByIdOrCreate(interaction.user.id);
    if (uDocument instanceof Error) return interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${uDocument.message})`
    });

    if (action === 'ROLL'){
        if (uDocument.nemusBizzareAdventure.diceOwned() < 1) return interaction.reply({
            ephemeral: true,
            content: `You have no dice left. You may reroll again in ${moment.duration(uDocument.nemusBizzareAdventure.nextDiceIn()).format('m [minutes and] s [seconds]')}`
        });
        await interaction.deferReply({ ephemeral: true });
        const result = _.random(1,6);
        let content = '';
        const diceInfoBefore = uDocument.nemusBizzareAdventure.getBasicInfo();
        if ((diceInfoBefore.floorTile + result) == 5){
            uDocument.nemusBizzareAdventure.consumeDice(15 + result);
            content = `Congratulations! Rolling a ${result} has brought you instantly to the next floor level! Keep up the good work!`
        } else if ((diceInfoBefore.floorTile + result) == 10){
            uDocument.nemusBizzareAdventure.totalLevels += result;
            uDocument.nemusBizzareAdventure.totalDiceConsumed++;
            content = `Congratulations! You can roll the dice again!`
        } else if ((diceInfoBefore.floorTile + result) == 15){
            uDocument.nemusBizzareAdventure.consumeDice(-(20 + result));
            if (uDocument.nemusBizzareAdventure.totalLevels < 0) uDocument.nemusBizzareAdventure.totalLevels = 0
            content = `Oops! Rolling a ${result} has brought you back to the previous floor level! Better luck next time!`
        } else {
            uDocument.nemusBizzareAdventure.consumeDice(result);
            content = `You rolled a ${result}. You earned +${rewardFromFloorLevel(uDocument.nemusBizzareAdventure.getBasicInfo().floorTile)} XP`
        };
        const reward = rewardFromFloorLevel(uDocument.nemusBizzareAdventure.getBasicInfo().floorTile);

        const res = uDocument.addXP(interaction.guildId, reward);
        return uDocument.save()
        .then(() => interaction.editReply({ ephemeral: true, content }))
        .then(async () => interaction.message.edit({
            content: interaction.message.content,
            components: interaction.message.components,
            files: [{
                name: 'nemus-bizzare-adventure.png',
                attachment: await generateNBAImage(uDocument)
            }]
        }))
        .then(async () => {
            if (res.before.level < res.after.level){
                const gDocument = await gModel.findByIdOrCreate(interaction.guildId);
                const roleRewards = [...Array(res.after.level + 1).keys()].slice(1).map(l => interaction.guild.roles.cache.get(gDocument.roles.rewards.find(r => r.level == l)?.role)?.id).filter(Boolean);
                if (roleRewards.length) await interaction.member.roles.add(roleRewards);
            };
        })
        .catch(e => interaction.editReply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${e.message})`
        }));
    };

    if (action === 'END'){
        return interaction.update({ components: [] });
    };
};

function rewardFromFloorLevel(floorLevel){
    if ([1,6,11,16].includes(floorLevel)){
        return 5;
    };
    if ([2,7,12,17].includes(floorLevel)){
        return 10;
    };
    if ([3,8,13,18].includes(floorLevel)){
        return 20;
    };
    if ([4,9,14,19].includes(floorLevel)){
        return 50;
    };
    return 0;
};
