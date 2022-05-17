'use strict';

const { Permissions, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('lodash');
const model = require('../models/userSchema.js');
const canvasLeaderboard = require('../utility/Canvas.leaderboard.js');

const command = new SlashCommandBuilder()
.setName('leaderboard')
.setDescription('Display this server\'s leaderboard');

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const collection = await model.getXPLeaderboard(interaction.guildId);

        if (!collection.length) return interaction.reply({
            ephemeral: true,
            content: '⚠️ This server has no leaderboard yet. Start chatting to gain XP!'
        });

        await interaction.deferReply();
        const colors = [ [212,175,55], [192,192,192], [205,127,50] ];

        const fetched = await interaction.guild.members.fetch({
            user: collection.map(x => x.id)
        });

        if (fetched instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${fetched.message}`
        });

        const collectionWithMember = collection.map(x => {
            const member = fetched.get(x.id);
            if (!member) return null;
            const avatarURL = member.displayAvatarURL({ format: 'png', size: 128 });
            const tag = member.user.tag;
            return { ...x, tag, avatarURL };
        }).filter(Boolean);

        const files = await canvasLeaderboard(_.chunk(collectionWithMember, 10)[0], 0);
        const components = [ new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('XP_LEADERBOARD:PREV:0')
                .setStyle('SECONDARY')
                .setLabel('PREV')
                .setDisabled(true),
            new MessageButton()
                .setCustomId('XP_LEADERBOARD:NEXT:0')
                .setStyle('SECONDARY')
                .setLabel('NEXT')
                .setDisabled(collectionWithMember.length <= 10),
        )];
        const embeds = _.chunk(collectionWithMember, 10)[0].map((x, i) => new MessageEmbed()
            .setAuthor({ name: x.tag })
            .setColor(colors[i] || '#A9A9A9')
            .setImage(`attachment://lb-${x.id}.png`)
        );
        embeds[embeds.length - 1].setFooter({ text: `Page 1 of ${_.chunk(collectionWithMember, 10).length}`})
        return interaction.editReply({ files, components, embeds })
    }
};
