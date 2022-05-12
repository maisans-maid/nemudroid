'use strict';

const gModel = require('../models/guildSchema.js');
const { ModalBuilder, ModalField } = require('discord-modal');

module.exports = async interaction => {

    const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
    if (gDocument instanceof Error)  return interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${gDocument.message})`
    });

    const role = interaction.guild.roles.cache.get(gDocument.roles.verification);
    if (!role) return interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Couldn\'t find the verification role`
    });

    if (interaction.member.roles.cache.has(role.id)) return interaction.reply({
        ephemeral: true,
        content: `❌ You are already verified!`
    });
  
    const modal = new ModalBuilder()
        .setCustomId(`VERIFY_USER:${role.id}`)
        .setTitle(`Before you get verified...`)
        .addComponents(
            new ModalField()
                .setLabel('What should we name you?')
                .setStyle('short')
                .setDefaultValue(interaction.user.username)
                .setPlaceholder('Make sure you follow the rule regarding nickname(s).')
                .setCustomId('NICKNAME')
                .setMax(32)
        );

    return interaction.client.modal.open(interaction, modal);
};
