'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageActionRow, MessageButton } = require('discord.js');
const { join } = require('path');
const levelCanvas = require('../utility/Canvas.level.js');

const command = new SlashCommandBuilder()
.setName('level')
.setDescription('Show level card')
.addUserOption(option => option
    .setName('user')
    .setDescription('The user you want to generate the card for')
);


module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: async (client, interaction) => {

        const user = interaction.options.getUser('user') || interaction.user;

        if (user.bot) return interaction.reply({
            ephemeral: true,
            content: 'Notice: Bots cannot earn XP!'
        });

        await interaction.deferReply();
        const attachment = await levelCanvas({
            profile: 'dark',
            member: await interaction.guild.members.fetch(user.id),
            guild: interaction.guild
        });

        return interaction.editReply({
            files: [{ attachment, name: 'rank.png' }],
            components: [new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`LEVEL:${interaction.member.id}:light`)
                    .setLabel('View in Light Mode')
                    .setStyle('SECONDARY')
                    .setEmoji('⛅')
            )]
        });
    }
};
