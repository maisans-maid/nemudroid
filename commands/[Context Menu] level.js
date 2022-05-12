'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageActionRow, MessageButton } = require('discord.js');
const { join } = require('path');
const levelCanvas = require('../utility/Canvas.level.js');

const command = new ContextMenuCommandBuilder()
    .setName('View Level Card')
    .setType(2)


module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: async (client, interaction) => {

        const member = interaction.options.getMember('user');

        if (member.user.bot) return interaction.reply({
            ephemeral: true,
            content: 'Notice: Bots cannot earn XP!'
        });

        await interaction.deferReply();
        const attachment = await levelCanvas({ member,
            profile: 'dark',
            guild: interaction.guild
        });

        return interaction.editReply({
            files: [{ attachment, name: 'rank.png' }],
            components: [new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`level-${interaction.member.id}-light`)
                    .setLabel('View in Light Mode')
                    .setStyle('SECONDARY')
                    .setEmoji('⛅')
            )]
        });
    }
};
