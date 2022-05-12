'use strict';

const model = require('../../../models/guildSchema');

const hCreate = require('./create.js');
const hDelete = require('./delete.js');
const hRefresh = require('./refresh.js');
const hEnd = require('./end.js');
const hFeedback = require('./feedback.js');

module.exports = async interaction => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('TICKETSYS')) return;

    const profile = await model.findByIdOrCreate(interaction.guildId).catch(e => e);

    if (profile instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Could not load the server configuration: ${profile.message}`
        });
    };

    const categoryChannel = interaction.guild.channels.cache.get(profile.channels.supportCategoryId);

    if (!categoryChannel){
       return interaction.reply({
           ephemeral: true,
           content: '❌ Category channel could not be found. It may have been deleted.'
       });
    };

    const indexIfExists = profile.channels.supportCategoryChildren.findIndex(x => x.userId === interaction.member.id);
    const channelIfExists = indexIfExists >= 0
        ? interaction.guild.channels.cache.get(profile.channels.supportCategoryChildren[indexIfExists].channelId)
        : null;

    if (interaction.customId === 'TICKETSYS-CREATE'){
        return hCreate(interaction, profile, indexIfExists, channelIfExists);
    };

    if (interaction.customId === 'TICKETSYS-END'){
        return hEnd(interaction);
    };

    if (interaction.customId === 'TICKETSYS-DISPOSE'){
        return hDelete(interaction, profile, indexIfExists, channelIfExists);
    };

    if (interaction.customId === 'TICKETSYS-REFRESH'){
        return hRefresh(interaction);
    };

    if (interaction.customId === 'TICKETSYS-FEEDBACK'){
        return hFeedback(interaction);
    };
};
