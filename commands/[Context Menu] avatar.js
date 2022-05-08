'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');

const command = new ContextMenuCommandBuilder()
    .setName('View Avatar')
    .setType(2)

module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: (client, interaction) => {

        const member = interaction.options.getMember('user');
        const embed = new MessageEmbed()
            .setColor([255,247,125])
            .setTitle(member.displayName)
            .setImage(member.user.displayAvatarURL({ size: 1024 }));

        return interaction.reply({ embeds: [embed] });
    }
};
