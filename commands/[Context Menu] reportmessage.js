'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const gModel = require('../models/guildSchema.js');
const moment = require('moment');

const command = new ContextMenuCommandBuilder()
    .setName('Report this message')
    .setType(3)

module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: async (client, interaction) => {

        const message = interaction.options.getMessage('message');

        if (message.author.id === interaction.user.id) return interaction.reply({
            ephemeral: true,
            content: 'Clearly there\'s something wrong with you if you try to report your own message. [](https://mentalhealth.org/)'
        });

        const content = message.content;
        const attachments = message.attachments;

        if (!content && !message.attachments.size) return interaction.reply({
            ephemeral: true,
            content: 'The message contained neither a text-message nor an/ attachment(s)'
        });

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

        const embed = new MessageEmbed()
            .setColor('ORANGE')
            .setAuthor({ name: `${interaction.user.tag} reported a message!` })
            .addField('Author', message.author.tag)
            .addField('Reported on', moment(new Date(interaction.createdAt)).format('LLLL'))
            .addField('Content', content?.substring(0,1000) || '*Empty (Check Attachments)*')
            .addField('Attachments', message.attachments?.map(x => `• [${x.name}](${x.url})`).join('\n').substr(0, 1000) || '*None*');

        const imageAttachments = message.attachments.filter(x => x.contentType.startsWith('image'));
        if (imageAttachments.size){
            embed.setImage(imageAttachments.first().url);
        };

        const row = new MessageActionRow().addComponents(new MessageButton()
            .setLabel('Original Post')
            .setStyle('LINK')
            .setURL(`https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`)
        );

        return channel.send({ embeds: [embed], components: [row] }).then(() => interaction.reply({
            ephemeral: true,
            content: '✅ The message has been reported! Thank you for making this community safe! If you think this matter is serious enough to warrant attention from Discord themselves, you may open up a ticket [here](<https://dis.gd/report>). Dont know how? Click [this](<https://support.discord.com/hc/en-us/articles/360000291932-How-to-Properly-Report-Issues-to-Trust-Safety>)'
        }))
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${e.message})`
        }));
    }
};
