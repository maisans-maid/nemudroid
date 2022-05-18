'use strict';

const levelCanvas = require('../utility/Canvas.level.js');
const { MessageButton, MessageActionRow } = require('discord.js');

module.exports = async interaction => {

    const profile = interaction.customId.split(':').pop();
    const userId = interaction.customId.split(':')[1];

    if (userId !== interaction.user.id) return interaction.reply({
        ephemeral: true,
        content: '❌ You cannot control this interaction!'
    });

    const components = [ new MessageActionRow().addComponents(interaction.message.components[0].components.map(x => new MessageButton(x).setDisabled(true))) ];
    await interaction.update({ components });

    const attachment = await levelCanvas({ profile,
        member: await interaction.guild.members.fetch(userId),
        guild: interaction.guild
    });

    return interaction.message.edit({
        files: [{ attachment, name: 'rank.png' }],
        components: [new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`LEVEL:${interaction.member.id}:${profile === 'light' ? 'dark' : 'light'}`)
                .setLabel(`View in ${profile === 'light' ? 'Dark' : 'Light'} Mode`)
                .setStyle('SECONDARY')
                .setEmoji(profile === 'light' ? '🌙' : '⛅')
        )]
    });
};
