'use strict';

const { Collection, MessageEmbed } = require('discord.js');

module.exports = async function deleteTicket(interaction, profile, indexIfExists, channelIfExists){
    const index = profile.channels.supportCategoryChildren.findIndex(x => x.channelId === interaction.channelId);
    if (index >= 0){
        profile.channels.supportCategoryChildren.splice(index, 1);
    };

    const channel = interaction.guild.channels.cache.get(profile.channels.supportTranscriptId);

    if (channel){
        let messages = new Collection(), size = 1, before, error;

        await interaction.reply({
            ephemeral: true,
            content: 'Please wait while I collect the transcript of this report. This channel will automatically be deleted afterwards.'
        });

        while (size && !error){
            const fetched = await interaction.channel.messages
                .fetch({ limit: 1, before })
                .catch(e => e);
            if (fetched instanceof Error){
                error = e;
            } else {
                size = fetched.filter(Boolean).size;
                before = fetched.filter(Boolean).sort((A, B) => B.createdAt - A.createdAt).first()?.id;
                messages = messages.concat(fetched);
            };
        };

        if (error){
            sendError(interaction, channel, error);
        };

        const filter = (message) => typeof message === 'object' && message.createdAt && message.author;
        const sort = (messageA, messageB) => messageA.createdAt - messageB.createdAt;

        const document = messages.filter(filter).sort(sort).map(message => {
            const attachments = message.attachments.size ? message.attachments.map(x => `\r\n!(attachment:${x.url})`).join('') : '';

            return `${message.author.tag} : ${message.content} ${attachments}`;
        }).join('\r\n\r\n');

        const reporter = interaction.channel.permissionOverwrites.cache
            .filter(overwrite => overwrite.type === 'member' && overwrite.id !== interaction.client.user.id)
            .map(overwrite => `${interaction.guild.members.cache.get(overwrite.id) || `<@${overwrite.id}`}`).join(', ');

        channel.send({
            files: [{ attachment: Buffer.from(document), name: interaction.channel.name + '.txt' }],
            embeds: [
                new MessageEmbed()
                .setColor('ORANGE')
                .setAuthor({
                    name: '⚙ Ticket Report Transcript'
                })
                .setDescription('Above is the transcript for recently ended ticket for client ' + reporter)
            ]
        }).catch(e => sendError(interaction, channel, e));
    };

    return profile.save()
    .then(() => interaction.channel.delete())
    .catch(e => interaction.reply(`❌ Error: ${e.message}`));
};

function sendError(interaction, channel, error){
    return channel.send({
        embeds: [
            new MessageEmbed()
            .setColor('RED')
            .setAuthor({
                name: '⚙ Ticket Report Transcript (Error)'
            })
            .setDescription(`An error was encountered while parsing the messages on channel **#${interaction.channel.name}**:\n\n${error.message}`)
        ]
    })
};
