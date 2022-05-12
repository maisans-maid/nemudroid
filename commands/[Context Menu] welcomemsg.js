'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageActionRow, MessageButton } = require('discord.js');
const gModel = require('../models/guildSchema.js');
const moment = require('moment');

const command = new ContextMenuCommandBuilder()
    .setName('Set as Welcome Message')
    .setType(3)

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const message = interaction.options.getMessage('message');

        if (!message.content) return interaction.reply({
            ephemeral: true,
            content: '❌ The message did not contain any text'
        });

        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${gDocument.message}`
        });

        gDocument.text.welcome = message.content;

        return gDocument.save()
        .then(() => interaction.reply({
            content: '✅ Successfully set this text for welcome messages!',
            ephemeral: true
        }))
        .catch(err => interaction.reply({
            content: `❌ Oops! Something went wrong: ${err.message}`,
            ephemeral: true
        }));
    }
};
