'use strict';

const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const moment = require('moment');
const gModel = require('../models/guildSchema.js');

module.exports = async interaction => {

    const targetMemberId = interaction.customId.split(':').pop();
    const targetMember = await interaction.guild.members.fetch(targetMemberId);
    const reason = interaction.fields.getTextInputValue('reason');
    const notes = interaction.fields.getTextInputValue('notes');

    const gDocument = await gModel.findByIdOrCreate(interaction.guildId, { 'channels.logger': 1 }).catch(e => e);
    if (gDocument instanceof Error) return interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${gDocument.message})`
    });

    const channelId = gDocument.channels.logger;
    if (!channelId) return interaction.reply({
        ephemeral: true,
        content: '❌ Logging channel was not set for this server (403)'
    });

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) return interaction.reply({
        ephemeral: true,
        content: '❌ Logging channel may have been deleted. Please wait for the mods to reconfigure the channel'
    });

    // always use GMT+8 timezone and ignore system clock
    const timezone = 8; // PH is on GMT+8
    const offset = 60_000 * (new Date().getTimezoneOffset() - ( -timezone * 60));

    const embed = new MessageEmbed()
        .setColor('ORANGE')
        .setAuthor({ name: 'A User has been reported!' })
        .setThumbnail(targetMember.user.displayAvatarURL())
        .addField('Who?', `${targetMember} (${targetMember.user.tag})`)
        .addField('Why?', `${reason}`)
        .addField('Reported By', interaction.user.tag)
        .addField('Reported On', moment(Date.now()).format('LLLL'))

    if (notes){
        embed.spliceFields(2, 0, {
            name: 'Notes',
            value: notes
        });
    };

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setLabel('Ban User')
            .setEmoji('⚒')
            .setStyle('DANGER')
            .setCustomId(`BAN:${targetMemberId}`),
        new MessageButton()
            .setLabel('Kick User')
            .setEmoji('🦵')
            .setStyle('DANGER')
            .setCustomId(`KICK:${targetMemberId}`)
    );

    return channel.send({ embeds: [embed], components: [row] }).then(() => interaction.reply({
        ephemeral: true,
        content: '✅ The message has been reported! Thank you for making this community safe!'
    }))
    .catch(e => interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${e.message})`
    }));
};
