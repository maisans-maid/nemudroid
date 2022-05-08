'use strict';

const gModel = require('../models/guildSchema.js');

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

    return interaction.member.roles.add(role.id).then(() => interaction.reply({
        ephemeral: true,
        content: '🎉 You have been successfully verified!'
    })).catch(e => interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${e.message})`
    }));
};
