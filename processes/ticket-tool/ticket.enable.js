'use strict';

const { codeBlock } = require('@discordjs/builders');
const { CategoryChannel, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const model = require('../../models/guildSchema.js');
const generateEmbed = require('./ticket.embed.js');

module.exports = async (client, interaction) => {
    const channel = interaction.options.getChannel('category-channel');

    if (!(channel instanceof CategoryChannel)){
        return interaction.reply({
            ephemeral: true,
            content: 'The selected channel is not a category channel!',
            embeds: [
                new MessageEmbed()
                .setColor([255,247,125])
                .setImage('https://cdn.discordapp.com/attachments/902363353677185095/917007108707336212/Animation.gif')
            ]
        });
    };

    await interaction.deferReply({ ephemeral: true });

    const profile = await model.findByIdOrCreate(interaction.guildId).catch(e => e);

    if (profile instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${profile.message}`
        });
    };

    profile.channels.supportCategoryId = channel.id;

    const mainChannel = await channel.createChannel('supportsys', {
        permissionOverwrites: channel.permissionOverwrites.cache
    }).catch(error => error);

    if (mainChannel instanceof Error){
        return interaction.editReply(`❌ Error: ${mainChannel.message}`);
    };

    const embeds = generateEmbed(interaction, profile);

    const components = [
        new MessageActionRow().addComponents(
            new MessageButton()
            .setCustomId('TICKETSYS-CREATE')
            .setLabel('Create a Ticket!')
            .setEmoji('📩')
            .setStyle('SECONDARY'),
            new MessageButton()
            .setCustomId('TICKETSYS-FEEDBACK')
            .setLabel('Submit a Feedback instead!')
            .setEmoji('🗨')
            .setStyle('SECONDARY'),
            new MessageButton()
            .setCustomId('TICKETSYS-REFRESH')
            .setLabel('Refresh')
            .setEmoji('🔃')
            .setStyle('SUCCESS')
        )
    ];

    const message = await mainChannel.send({ embeds, components })
        .catch(err => err);

    if (message instanceof Error){
        return interaction.editReply(`❌ Error: ${message.message}`);
    };

    profile.channels.supportTextId = mainChannel.id;

    const transcript = await channel.createChannel('transcript', {
        topic: '⚠ DO NOT DELETE THIS CHANNEL! THIS WILL BE USED FOR TRANSCRIPTS',
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone.id,
                deny: [ 'VIEW_CHANNEL' ]
            },
        ]
    }).catch(error => error)

    if (transcript instanceof Error){
        return interaction.editReply(`❌ Error: ${mainChannel.message}`);
    };

    profile.channels.supportTranscriptId = transcript.id;

    return profile.save()
    .then(() => interaction.editReply({
        content: `Support system was configured and bound to **${channel.name}**`
    }))
    .catch(e => interaction.editReply({
        content: `❌ Error: ${e.message}`
    }));
};
