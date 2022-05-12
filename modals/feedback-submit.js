'use strict';

const { MessageEmbed } = require('discord.js');
const gModel = require('../models/guildSchema.js');

module.exports = async interaction => {
    await interaction.deferReply({ ephemeral: true })
    const gDocument = await gModel.findByIdOrCreate(interaction.guildId, {
        'channels.supportTranscriptId': 1
    }).catch(e => e);
    if (gDocument instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${gDocument.message}`
        });
    };
    const channel = interaction.guild.channels.cache.get(gDocument.channels.supportTranscriptId);
    if (!channel){
        return interaction.editReply('❌ Unable to locate transcript Id. Please try again later.');
    };
    return channel.send({
        embeds: [
            new MessageEmbed()
            .setColor('BLUE')
            .setAuthor({
                name: '🗨 Feedback Transcript'
            })
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTitle(interaction.fields.getTextInputValue('subject'))
            .setDescription(interaction.fields.getTextInputValue('description'))
            .addField('Submitted by', interaction.user.tag)
            .setTimestamp()
        ]
    })
    .then(() => interaction.editReply('Successfully sent your feedback!'))
    .catch(() => interaction.editReply('Failed to send your feedback! Please try again later!'));
};
