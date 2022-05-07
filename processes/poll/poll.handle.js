'use strict';

const _ = require('lodash');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { ModalBuilder, ModalField } = require('discord-modal');
const model = require('../../models/pollSchema.js');
const PollEmbed = require('./poll.Embed.js');
const PollComponents = require('./poll.Components.js');

module.exports = async interaction => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('POLL')) return;

    const pollId = interaction.customId.split(':')[1];
    const choiceId = interaction.customId.split(':')[2];

    const pDocument = await model.findById(pollId);

    const pollChannel = interaction.guild.channels.cache.get(pDocument.channelId);

    if (choiceId === 'RECENT'){
        if (interaction.member.id !== pDocument.authorId) return interaction.reply({
            ephemeral: true,
            content: `❌ Only <@${pDocument.authorId}> may control this poll!`
        });

        await interaction.message.delete();
        return interaction.channel.send({
            embeds: interaction.message.embeds,
            components: interaction.message.components,
            fetchReply: true
        }).then(msg => {
            pDocument.messageId = msg.id;
            pDocument.save();
        });
    };

    if (choiceId === 'END'){
        if (interaction.member.id !== pDocument.authorId) return interaction.reply({
            ephemeral: true,
            content: `❌ Only <@${pDocument.authorId}> may control this poll!`
        });

        pDocument.topic = `${pDocument.question.substr(0, 248)} (Ended)`;
        pDocument.options = pDocument.options
            .sort((A,B) => B.voters.length - A.voters.length)
            .map((choice, i) => {
                return {
                    id: choice.id,
                    topic: `${['🥇 ', '🥈 ', '🥉 '][i] || ''} ${choice.topic}`,
                    voters: choice.voters
                };
            });

        const embed = new PollEmbed(interaction.user, pDocument.sortByVotes());
        const components = interaction.message.components.slice(interaction.message.components.length - 1).map(ActionRow => new MessageActionRow().addComponents(
            ActionRow.components.map(button => new MessageButton(button).setDisabled(true))
        ));

        return interaction
          .update({ embeds: [embed], components })
          .then(() => pDocument.delete())
          .catch(e => interaction.reply({
              ephemeral: true,
              content: `Oops! Something went wrong. (${e.message})`
          }));
    };

    if (choiceId === 'ADD_1'){
        if (interaction.member.id !== pDocument.authorId) return interaction.reply({
            ephemeral: true,
            content: `❌ Only <@${pDocument.authorId}> may control this poll!`
        });
        const modal = new ModalBuilder()
        .setCustomId(`POLL:${pDocument._id}:ADD_2`)
        .setTitle('Poll | Add an option')
        .addComponents(
            new ModalField()
                .setLabel('Option')
                .setStyle('short')
                .setPlaceholder('Add an option')
                .setCustomId(`option`)
                .setMax(250)
                .setRequired(true)
        );

        return interaction.client.modal.open(interaction, modal);
    };

    pDocument.addVote(choiceId, interaction.member.id);
    const embed = new PollEmbed(interaction.user, pDocument);
    const components = new PollComponents().generateComponentsFrom(pDocument);

    return interaction.update({
        embeds: [ embed ],
        components
    })
    .then(() => pDocument.save())
    .catch(err => interaction.reply({
        ephemeral: true,
        content: `❌ Error: ${err.message}`
    }));
};
