'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { join } = require('path');
const gamestatsCanvas = require('../utility/Canvas.gamestats.js');

const command = new SlashCommandBuilder()
.setName('gamestats')
.setDescription('Show game stats')
.addUserOption(option => option
    .setName('user')
    .setDescription('The user you want to generate the card for')
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const user = interaction.options.getUser('user') || interaction.user;
        if (user.bot) return interaction.reply({
            ephemeral: true,
            content: 'Notice: Bots cannot play games!'
        });

        await interaction.deferReply();
        const attachment = await gamestatsCanvas({
            profile: 'dark',
            member: await interaction.guild.members.fetch(user.id),
            guild: interaction.guild
        });

        return interaction.editReply({
            files: [{ attachment, name: 'games.png' }]
        });
    }
};
