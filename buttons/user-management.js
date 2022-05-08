'use strict';

const { ModalBuilder, ModalField } = require('discord-modal');

module.exports = async interaction => {

    const action = interaction.customId.split(':')[0];

    if (!interaction.member.permissions.has(`${action}_MEMBERS`)) return interaction.reply({
        ephemeral: true,
        content: `❌ You have no permission to ${action.toLowerCase()} users!`
    });

    const targetMemberId = interaction.customId.split(':').pop();
    const targetUser = await interaction.client.users.fetch(targetMemberId).catch(e => e)
    if (targetUser instanceof Error) return interaction.reply({
        ephemeral: true,
        content: `❌ Oh no! Something went wrong (${targetUser.message})`
    });

    const modal = new ModalBuilder()
        .setCustomId(`${action.toUpperCase()}:${targetMemberId}`)
        .setTitle(`${action.charAt(0) + action.slice(1).toLowerCase()} ${targetUser.tag}?`)
        .addComponents(
            new ModalField()
                .setLabel(`Type "${action} USER" (case-sensitive)`)
                .setStyle('short')
                .setPlaceholder('Or you can just reprimand the user first if it\'s not severe.')
                .setCustomId('confirmation')
                .setMax(action.length + 5)
                .setRequired(true)
        )

    return interaction.client.modal.open(interaction, modal);
};
