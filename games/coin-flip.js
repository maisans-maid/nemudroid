'use strict';

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const uModel = require('../models/userSchema.js');
const generateNotificationEmbed = require('./tools/embed-version-2.js');

module.exports = async interaction => {

    const choices = ['Head', 'Tail'];
    const row = new MessageActionRow().addComponents([...choices, 'Quit'].map(button => new MessageButton()
        .setLabel(button)
        .setCustomId(button)
        .setStyle(choices.includes(button) ? 'SECONDARY' : 'DANGER' )
    ));
    const embed = new MessageEmbed()
        .setTitle('COINFLIP')
        .setDescription('Guess which side of the coin faces upwards after a throw. Head or Tail?')
        .setColor([255,247,125]);
    const message = await interaction.reply({
        components: [row],
        embeds: [embed],
        fetchReply: true
    });
    const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON', time: 30_000
    });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({
            ephemeral: true,
            content: 'This challenge is not for you!'
        });
        if (i.customId === 'Quit'){
            i.deferUpdate();
            return collector.stop('Quit')
        };
        const uDocument = await uModel.findByIdOrCreate(interaction.user.id).catch(e => e);
        if (uDocument instanceof Error){
            collector.stop();
            return i.reply({
                ephemeral: true,
                content: `Oops! Something wrong has happened (${uDocument.message})`
            });
        };
        const botPick = choices[_.random(0, 1)];
        const userPick = i.customId;
        const hasWon = botPick == userPick;

        uDocument.gameStats.coinFlip.scores.push(Number(hasWon));

        if (embed.fields.length) embed.spliceFields(0, 1);
        embed.addField(`Win Rate`, (uDocument.gameStats.coinFlip.scores.reduce((A,B) => A + B, 0) * 100 /  (uDocument.gameStats.coinFlip.scores.length || 1)).toFixed(2) + '%');

        return uDocument.save().then(() => {
            collector.resetTimer({ time: 30_000 });
            return i.update({
                content: `${hasWon ? '🎉' : '❌'} The result was **${botPick}**!`,
                embeds: [ embed.setFooter({ text: 'Click on the button below to play again' }) ] ,
                components: [ row ]
            });
        }).catch(e => {
            collector.stop();
            return i.reply({
                ephemeral: true,
                content: `❌ Error: ${e.message}`
            });
        });
    });

    collector.on('end', async collected => {
        const uDocument = await uModel.findByIdOrCreate(interaction.user.id);
        const embed2 = await generateNotificationEmbed('coinFlip', uDocument, interaction);
        const response = {
            content: '⚔️ This challenge has ended!',
            embeds: [ embed.setFooter({ text: '' }).setColor('RED') ],
            components: [ new MessageActionRow().addComponents(row.components.map(button => new MessageButton(button).setDisabled(true)))]
        };
        if (embed2) response.embeds.push(embed2);
        return message.edit(response);
    });

    return;
};
