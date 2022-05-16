'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { info } = require('youtube-info-streams');

const command = new SlashCommandBuilder()
.setName('schedule-event')
.setDescription('Automatically add an event to this server from a link!')
.addStringOption(option => option
    .setName('youtube')
    .setDescription('Add a scheduled youtube stream to Events!')
    .setRequired(true)
)

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const youtube = interaction.options.getString('youtube');
        const videoId = youtube.match(/youtu(?:.*\/v\/|.*v\=|\.be\/)([A-Za-z0-9_\-]{11})/)?.[1] || null;

        if (!videoId) return interaction.reply({
            ephemeral: true,
            content: '❌ Invalid youtube video URL!'
        });

        const videoInfo = await info(videoId).catch(e => e);
        if (videoInfo instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${videoInfo.message})`
        });
        if (!videoInfo.videoDetails.isUpcoming) return interaction.reply({
            ephemeral: true,
            content: '❌ Event creation failed: This video is not an upcoming stream!'
        });

        await interaction.deferReply({ ephemeral: true });

        const { videoDetails } = videoInfo;
        const { thumbnails } = videoDetails.thumbnail;
        const largestWidth = thumbnails.reduce((acc, cur) => Math.max(acc, cur.width), 0);
        const largestWidthIndex = thumbnails.findIndex(x => x.width === largestWidth);
        const guildScheduledEventCreateOptions = {
            name: videoDetails.title,
            description: videoDetails.shortDescription.substr(0, 1000),
            scheduledStartTime: videoDetails.liveBroadcastDetails.startTimestamp,
            scheduledEndTime: new Date(videoDetails.liveBroadcastDetails.startTimestamp).getTime() + 3_600_000 * 2,
            privacyLevel: 'GUILD_ONLY',
            image: thumbnails[largestWidthIndex].url,
            entityType: 'EXTERNAL',
            entityMetadata: { location: `https://youtu.be/${videoId}` },
        };

        return interaction.guild.scheduledEvents.create(guildScheduledEventCreateOptions)
        .then(() => interaction.editReply('✅ Event successfully added. Check your events'))
        .catch(e => interaction.editReply(`❌ Oops! Something went wrong (${e.message})`));
    }
};
