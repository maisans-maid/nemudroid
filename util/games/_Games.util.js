'use strict';

const { Collection } = require('discord.js');

function getGameCache(interaction, game){
    return interaction.client.localCache.games
            .get(game) ||
        interaction.client.localCache.games
            .set(game, new Collection())
            .get(game);
};

exports.checkDuplicateInstance = async function (interaction, game) {
    const gameCache = getGameCache(interaction, game);

    if (gameCache.has(interaction.user.id)){
        await interaction.reply({
            ephemeral: true,
            content: `You are already playing **${game}**!`
        });
        return false;
    };

    gameCache.set(interaction.user.id, {});

    return true;
};

exports.removeInstance = function (interaction, game) {
    return getGameCache(interaction, game).delete(interaction.user.id);
};
