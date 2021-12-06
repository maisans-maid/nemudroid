'use strict';

const model = require('../models/pollSchema.js');
const _ = require('lodash');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');


exports.processPollButton = async function (interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('POLL')) return;

    const userId = interaction.user.id;
    const pollId = interaction.customId.split(':')[1];
    const choiceId = interaction.customId.split(':')[2];
    let hasVoted = false;

    const document = await model.findById(pollId).catch(e => e);

    if (!document || document instanceof Error){
       return interaction.reply({
            ephemeral: true,
            content: '❌ Could not retrieve the poll data from the database!'
        });
    };

    const message = await interaction.channel.messages
        .fetch(document.messageId)
        .catch(() => {});

    if (choiceId === 'COLLECT'){
        if (userId !== document.creatorId){
            return interaction.reply({
                ephemeral: true,
                content: '❌ You are not the instantiator of this poll!'
            });
        };

        if (message && !message.deleted){
            await message.delete().catch(() => {});
        };

        return interaction.channel.send(pollEmbedEnd(document))
        .then(() => document.delete())
        .then(() => interaction.deferUpdate())
        .catch(err => interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${err.message}`
        }));
    };

    if ([...document.choices.values()].some(x => x.userIds.includes(userId))){
        const key = [...document.choices.entries()]
            .filter(([k,v]) => v.userIds.includes(userId))
            .map(([k, v]) => k)[0];

        if (choiceId === key){
            return interaction.reply({
                ephemeral: true,
                content: `❌ You already voted for **${document.choices.get(key).name}**!`
            })
        };

        const choice = document.choices.get(key);
        hasVoted = choice;
        choice.userIds.splice(choice.userIds.indexOf(userId), 1)
        document.choices.set(key, choice);
    };

    const selection = document.choices.get(choiceId)
    selection.userIds.push(userId)
    document.choices.set(choiceId, selection);

    document.choices = Object.fromEntries(document.choices);
    const emojis = ['🟢','🟠','🟡','🔴','🟤','🔵','🟣','⚪','⚫','🔘'];

    if (message && message.editable){
        return message.edit(pollEmbed(document, emojis))
        .then(() => document.save())
        .then(() => interaction.reply({
            ephemeral: true,
            content: hasVoted
                ? `🎉 You changed your vote from **${hasVoted.name}** to **${selection.name}**`
                : `🎉 You voted for **${selection.name}**!`
        }))
        .catch(err => interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${err.message}`
        }));
    } else {
        const buttons = [...document.choices.values()].map((choice, index) => new MessageButton()
            .setCustomId(`POLL:${pollId}:${index + 1}`)
            .setEmoji(emojis[index])
            .setStyle('SECONDARY')
        );

        const components = [ ..._.chunk(buttons, 5).map(row => new MessageActionRow()
                .addComponents(row)
            ),
            new MessageActionRow().addComponents(
                new MessageButton()
                .setCustomId(`POLL:${pollId}:COLLECT`)
                .setLabel('Collect results and end this Poll')
                .setStyle('SUCCESS')
            )
        ];
        return interaction.channel.send({...pollEmbed(document, emojis), components })
        .then(message => {
            document.messageId = message.id;
            return document.save()
        })
        .then(() => interaction.reply({
            ephemeral: true,
            content: hasVoted
                ? `🎉 You changed your vote from **${hasVoted.name}** to **${selection.name}**`
                : `🎉 You voted for **${selection.name}**!`
        }))
        .catch(err => interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${err.message}`
        }));
    };
};

function pollEmbedEnd(document){
    return {
        embeds: [
            new MessageEmbed()
            .setAuthor(`Poll | ${document.question}`)
            .setColor([255,247,125])
            .setDescription(`*by: <@${document.creatorId}>*`)
            .setFooter('This poll has ended.')
            .addFields([...document.choices.values()]
                .sort((A,B) => B.userIds.length - A.userIds.length)
                .map((choice, index) => Object.assign({}, {
                    name: `${index === 0 ? '⭐' : ''} ${choice.name}`,
                    value: `${choice.userIds.length} vote${choice.userIds.length > 1 ? 's' : ''}.`
                }))
            )
        ]
    };
};

function pollEmbed(document, emojis){
    return {
        embeds: [
            new MessageEmbed()
            .setAuthor(`Poll | ${document.question}`)
            .setDescription(`*by: <@${document.creatorId}>*`)
            .setColor([255,247,125])
            .setFooter('Select from one of the choices below')
            .addFields([...document.choices.values()].map((choice, index) => Object.assign({}, {
                name: `${emojis[index]} - ${choice.name}`,
                value: `${choice.userIds.length} vote(s)`
            })))
        ]
    }
}
