'use strict';

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const model = require('../models/userSchema.js');
const canvasLeaderboard = require('../utility/Canvas.leaderboard.js');


module.exports = async interaction => {
    if (!interaction.customId.startsWith('XP_LEADERBOARD')) return;

    return interaction.reply({
        ephemeral: true,
        content: '🔒 This feature is currently locked!'
    });

    // const collection = await model.getXPLeaderboard(interaction.guildId);
    // if (!collection.length) return interaction.reply({
    //     content: '⚠️ This server has no leaderboard yet. Start chatting to gain XP!'
    // });
    //
    // const disableButtons = x => new MessageButton(x).setDisabled(true);
    // const pseudoComponents = new MessageActionRow().addComponents(interaction.message.components[0].components.map(disableButtons));
    //
    // await interaction.update({
    //     embeds: interaction.message.embeds,
    //     components: [ pseudoComponents ],
    //     files: interaction.message.attachments
    // });
    //
    // const colors = [ [212,175,55], [192,192,192], [205,127,50] ];
    // const action = interaction.customId.split(':')[1];
    // const page = Number(interaction.customId.split(':')[2]);
    // const indexIdPrev = action === 'NEXT' ? page : page - 2;
    // const indexIdNext = action === 'NEXT' ? page + 2 : page;
    //
    // const fetched = await interaction.guild.members.fetch({
    //     user: collection.map(x => x.id)
    // });
    //
    // if (fetched instanceof Error) return console.log('ERROR on LEADERBOARD-BUTTON');
    //
    // const collectionWithMember = collection.map(x => {
    //     const member = fetched.get(x.id);
    //     if (!member) return null;
    //     const avatarURL = member.displayAvatarURL({ format: 'png', size: 128 });
    //     const tag = member.user.tag;
    //     return { ...x, tag, avatarURL };
    // }).filter(Boolean);
    //
    // const files = await canvasLeaderboard(_.chunk(collectionWithMember, 10)[0], action === 'NEXT' ? page + 1 : page - 1);
    // const components = [ new MessageActionRow().addComponents(
    //     new MessageButton()
    //         .setCustomId(`XP_LEADERBOARD:PREV:${indexIdPrev}`)
    //         .setStyle('SECONDARY')
    //         .setLabel('PREV')
    //         .setDisabled(indexIdPrev < 0),
    //     new MessageButton()
    //         .setCustomId(`XP_LEADERBOARD:NEXT:${indexIdNext}`)
    //         .setStyle('SECONDARY')
    //         .setLabel('NEXT')
    //         .setDisabled(indexIdNext >= _.chunk(collectionWithMember, 10).length - 1),
    // )];
    // const embeds = _.chunk(collectionWithMember, 10)[0].map((x, i) => new MessageEmbed()
    //     .setAuthor({ name: x.tag })
    //     .setColor(colors[i] || '#A9A9A9')
    //     .setImage(`attachment://lb-${x.id}.png`)
    // );
    // return interaction.message.edit({ files, components, embeds });
};
