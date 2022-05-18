'use strict';

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const model = require('../models/userSchema.js');
const canvasLeaderboard = require('../utility/Canvas.leaderboard.js');


module.exports = async interaction => {
    if (!interaction.customId.startsWith('XP_LEADERBOARD')) return;

    // index refers to the index used by the previous leaderboard
    const userId = interaction.customId.split(':')[1];
    const action = interaction.customId.split(':')[2];
    const index = Number(interaction.customId.split(':').pop());
    const newIndex = action == 'NEXT' ? index + 1 : index - 1;

    const disableButtons = x => new MessageButton(x).setDisabled(true);
    const pseudoComponents = new MessageActionRow().addComponents(interaction.message.components[0].components.map(disableButtons));

    if (userId !== interaction.user.id) return interaction.reply({
        ephemeral: true,
        content: '❌ You cannot control this interaction!'
    });

    await interaction.update({
        content: 'Loading Leaderboard...',
        embeds: [],
        files: [],
        components: [ pseudoComponents ]
    });

    const collection = await model.getXPLeaderboard(interaction.guildId);
    if (!collection.length) return interaction.message.edit({
        content: '⚠️ This server has no leaderboard yet. Start chatting to gain XP!'
    });

    const fetched = await interaction.guild.members.fetch({ user: collection.map(x => x.id)});
    if (fetched instanceof Error) return interaction.message.edit({
        content: `❌ Oops! Something went wrong! (Members.onFetch<${fetched.message}>)`
    });

    const collectionWithMember = collection.filter(x => fetched.has(x.id));
    if (!collectionWithMember.length) return interaction.message.edit({
        content: '⚠️ This server has no leaderboard yet. Start chatting to gain XP!'
    });

    const colors = [ [212,175,55], [192,192,192], [205,127,50] ];
    if (action === 'PREV' && index !== 1) colors.splice(0, colors.length);
    if (action === 'NEXT') colors.splice(0, colors.length);

    const currentPageMember = _.chunk(collectionWithMember, 10)[newIndex];
    const messageOptions = { content: null };

    messageOptions.files = await canvasLeaderboard(currentPageMember.map(x => ({ ...x, avatarURL: fetched.get(x.id).user.displayAvatarURL({ format: 'png', size: 128 })})), newIndex);
    messageOptions.embeds = currentPageMember.map((x, i) => new MessageEmbed()
        .setAuthor({ name: fetched.get(x.id).user.tag })
        .setColor(colors[i] || '#A9A9A9')
        .setImage(`attachment://lb-${x.id}.png`)
    );
    messageOptions.components = [ pseudoComponents ];
    messageOptions.components[0].components.map(x => x.setDisabled(false).setCustomId(`XP_LEADERBOARD:${userId}:${x.customId.split(':')[2]}:${newIndex}`));

    if (action === 'PREV' && newIndex == 0){ // Disable Prev
        messageOptions.components[0].components.find(x => x.label === 'PREV').setDisabled(true)
    };
    if (action === 'NEXT' && !_.chunk(collectionWithMember, 10)[newIndex + 1]?.length){ // Disable next
        messageOptions.components[0].components.find(x => x.label === 'NEXT').setDisabled(true)
    };

    messageOptions.embeds[messageOptions.embeds.length - 1].setFooter({ text: `Page ${newIndex + 1} of ${_.chunk(collectionWithMember, 10).length}`})

    return interaction.message.edit(messageOptions);
};
