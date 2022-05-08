'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ModalBuilder, ModalField } = require('discord-modal');
const { Permissions } = require('discord.js');

const command = new ContextMenuCommandBuilder()
    .setName('Report User')
    .setType(2)

module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: (client, interaction) => {

        const member = interaction.options.getMember('user');
        const modal = new ModalBuilder()
            .setCustomId(`REPORT_USER:${member.id}`)
            .setTitle(`Report user ${member.displayName}?`)
            .addComponents(
                new ModalField()
                    .setLabel('Reason')
                    .setStyle('paragraph')
                    .setPlaceholder('How is this user misbehaving?')
                    .setCustomId(`reason`)
                    .setMax(1000)
                    .setRequired(true),
                new ModalField()
                    .setLabel('Notes')
                    .setStyle('paragraph')
                    .setPlaceholder('Add a note')
                    .setCustomId('notes')
                    .setMax(1000)
                    .setRequired(false)
            );
        return interaction.client.modal.open(interaction, modal);
    }
};
