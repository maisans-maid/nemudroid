'use strict';

const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const moment = require('moment');

module.exports = async interaction => {

    const action = interaction.customId.split(':')[0];
    const targetMemberId = interaction.customId.split(':').pop();
    const confirmation = interaction.fields.getTextInputValue('confirmation');

    if (confirmation !== `${action} USER`) return interaction.reply({
        ephemeral: true,
        content: '❌ Invalid Input!'
    });

    if (interaction.guild.me.permissions.has(`${action}_MEMBERS`)) return interaction.reply({
        ephemeral: true,
        content: `❌ It seems that I don\'t have the permission to ${action.toLowerCase()} users!`
    });

    if (action === 'KICK'){
        const targetMember = await interaction.guild.members.fetch(targetMemberId).catch(e => e);
        if (targetMember instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `This user is no longer in this server!`
        });
    };

    return interaction.guild.members[action.toLowerCase()](targetMemberId, `Kicked by ${interaction.user.tag} via ${interaction.client.user.username}`)
        .then(() => interaction.reply({
            ephemeral: true,
            content: `User successfully ${action == 'KICK' ? 'kicked' : 'banned' }!`
        }))
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `❌ Oh no! Something went wrong (${e.message})`
        }));
};
