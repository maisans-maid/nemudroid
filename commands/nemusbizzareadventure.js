'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageActionRow, MessageButton } = require('discord.js');
const uModel = require('../models/userSchema.js');

// NBA here refers to Nemu's bizzare adventure, not national basketball association
const generateNBAImage = require('../utility/Canvas.NBA.js');

const command = new SlashCommandBuilder()
.setName('nemus-bizzare-adventure')
.setDescription('Help nemu reach the top of the tower')

module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: async (client, interaction) => {

        const uDocument = await uModel.findByIdOrCreate(interaction.user.id);
        if (uDocument instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${uDocument.message})`
        });

        return interaction.reply({
            content: 'Help Nemu reach the top of the tower',
            files: [{
                name: 'nemus-bizzare-adventure.png',
                attachment: await generateNBAImage(uDocument)
            }],
            components: [ new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`NBA:${interaction.user.id}:ROLL`)
                    .setLabel('Roll')
                    .setStyle('SUCCESS')
                    .setEmoji('🎲'),
                new MessageButton()
                    .setCustomId(`NBA:${interaction.user.id}:ASK`)
                    .setLabel('How to play')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId(`NBA:${interaction.user.id}:END`)
                    .setLabel('End Interaction')
                    .setStyle('DANGER')
            )]
        });
    }
};
