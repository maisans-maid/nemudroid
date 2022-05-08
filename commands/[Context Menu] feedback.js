'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { ModalBuilder, ModalField } = require('discord-modal');

const command = new ContextMenuCommandBuilder()
    .setName('Send as Feedback')
    .setType(3)

module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: async (client, interaction) => {

        const message = interaction.options.getMessage('message');
        const content = message.content;
        if (!content) return interaction.reply({
            ephemeral: true,
            content: '⚠ The message did not contain any text.'
        });

        const modal = new ModalBuilder()
        .setCustomId('SUBMIT_FEEDBACK')
        .setTitle('Submit this message as Feedback!')
        .addComponents(
            new ModalField()
              .setLabel('Subject')
              .setStyle('short')
              .setPlaceholder('Topic for this feedback')
              .setCustomId('subject')
              .setMax(256)
              .setRequired(true),
          new ModalField()
              .setLabel('Description')
              .setStyle('paragraph')
              .setPlaceholder('Brief explanation of your feedback...')
              .setDefaultValue(content.substr(0, 2000))
              .setCustomId('description')
              .setMax(2000)
              .setRequired(true)
        );

        return interaction.client.modal.open(interaction, modal);
    }
};
