'use strict';

const { Permissions, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('intro')
.setDescription('View member introductions.')
.addUserOption(option => option
    .setName('user')
    .setDescription('Whose introduction would you like to see?')
    .setRequired(true)
)


module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const user = interaction.options.getUser('user');
        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${gDocument.message}`
        });

        const { introduction: channelId } = gDocument.channels;
        if (channelId == null) return interaction.reply({
            ephemeral: true,
            content: '⚠️ Channel for fetching introduction message not set!'
        });

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) return interaction.reply({
            ephemeral: true,
            content: '❌ Channel for fetching introduction message could not be found.'
        });

        let message, lastMessageId, collectionSize = 1;
        const messageSort1 = (B,A) => A.createdTimestamp - B.createdTimestamp;
        const messageSort2 = (A,B) => A.createdTimestamp - B.createdTimestamp;
        const messageFilter = m => m.author.id === user.id;

        message = channel.messages.cache.filter(messageFilter).sort(messageSort1).first();
        lastMessageId = channel.messages.cache.sort(messageSort2).last()?.id;

        while(!message && collectionSize !== 0){
            if (!interaction.deferred) await interaction.deferReply();

            const fetched = await channel.messages.fetch({ before: lastMessageId }).catch(e => e);
            if (fetched instanceof Error) return interaction.editReply({
                content: `❌ Oops! Something went wrong (${fetched.message}).`
            });

            lastMessageId = fetched.sort(messageSort2).last()?.id;
            message = fetched.find(messageFilter);
            collectionSize = fetched.size;
        };

        if (!message) return interaction.editReply({
            content: `⚠️ No introduction message was found for **\`${user.tag}\`**`
        });

        const messageOptions = {
            content: `Here is **${user.tag}**'s Introductory Message~`,
            components: [ new MessageActionRow().addComponents(
                new MessageButton()
                    .setLabel('Jump to OP (Original Post)')
                    .setURL(message.url)
                    .setStyle('LINK')
            )],
            embeds: [
              new MessageEmbed()
                  .setColor([255,247,125])
                  .setDescription(message.content?.substr(0,2000) || '')
                  .setThumbnail(message.author.displayAvatarURL())
                  .setImage(message.attachments.find(x => x.height)?.url)
            ]
        };

        if (interaction.deferred){
            return interaction.editReply(messageOptions);
        } else {
            return interaction.reply(messageOptions);
        };
    }
};
