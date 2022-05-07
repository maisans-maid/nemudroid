'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { ModalBuilder, ModalField } = require('discord-modal');
// const moment = require('moment');

const pModel = require('../models/pollSchema.js');
// const embedTemplate = require('../processes/poll/poll.embed.js');
// const componentsTemplate = require('../processes/poll/poll.components.js');


const command = new SlashCommandBuilder()
.setName('poll')
.setDescription('Generate poll.')

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const authorPoll = await pModel.findOne({ authorId: interaction.member.id });
        if (authorPoll){
            const channel = interaction.guild.channels.cache.get(authorPoll.channelId);
            const message = await channel.messages.fetch(authorPoll.messageId).catch(() => {});
            if (!message) { await authorPoll.delete() } else { return interaction.reply({
                  ephemeral: true,
                  content: `Please end your [**previous poll**](<https://discord.com/channels/${authorPoll.guildId}/${authorPoll.channelId}/${authorPoll.messageId}>) first before making a new one.`
            })};
        };

        const modal = new ModalBuilder()
            .setCustomId('POLL:CREATE')
            .setTitle('Poll')
            .addComponents(
                new ModalField()
                    .setLabel('Question')
                    .setStyle('short')
                    .setPlaceholder('What\'s your poll about?')
                    .setCustomId('question')
                    .setMax(250)
                    .setRequired(true),
                ...[1,2,3,4].map(n => new ModalField()
                    .setLabel('Option')
                    .setStyle('short')
                    .setPlaceholder(`Add ${n == 1 ? 'an' : 'another'} option.`)
                    .setCustomId(`option-${n}`)
                    .setMax(250)
                    .setRequired(n < 3 ? true : false)
                )
            );

        return interaction.client.modal.open(interaction, modal);

    //     return interaction.reply('🔒 This feature is locked')
    //

    //
    //     const pDocument = new pModel().register(interaction);
    //     for (let i = 1; i < 11; i++){
    //         const topic = interaction.options.getString(`option-${i}`);
    //         if (topic){
    //             pDocument.addChoice(topic);
    //         };
    //     };
    //
    //     const embed = await embedTemplate(pDocument, interaction.member.user);
    //     const components = componentsTemplate(pDocument);
    //
    //     return interaction.channel.send({ embeds: [embed], components, fetchReply: true })
    //     .then(message => {
    //         pDocument.messageId = message.id;
    //         return pDocument.save();
    //     })
    //     .then(() => interaction.reply({ ephemeral: true, content: 'Poll successfully created!'}))
    //     .catch(err => interaction.reply({ ephemeral: true, content: `❌ Error: ${err.message}`}));
    }
};
