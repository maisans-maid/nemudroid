'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const gameModules = {};

for (const game of readdirSync(join(__dirname, '..', 'games')).filter(f => f.split('.').pop() === 'js')){
    gameModules[game.split('.js')[0]] = require(`../games/${game}`);
};

const command = new SlashCommandBuilder()
.setName('play')
.setDescription('Play various games')
.addSubcommand(options => options
  .setName('captcha')
  .setDescription('Play captcha-solver')
)
.addSubcommand(options => options
  .setName('coin-flip')
  .setDescription('Play coin flip')
)
.addSubcommand(options => options
  .setName('hangman')
  .setDescription('Play hangman')
)
.addSubcommand(options => options
  .setName('minesweeper')
  .setDescription('Play minesweeper')
)
.addSubcommand(options => options
  .setName('rps')
  .setDescription('Play rock-paper-scissors')
)
.addSubcommand(options => options
  .setName('tic-tac-toe')
  .setDescription('Play tic-tac-toe')
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const subcommand = interaction.options.getSubcommand();

        if (!interaction.client.custom.cache.games.has(interaction.guildId)){
            interaction.client.custom.cache.games.set(interaction.guildId, new Collection())
        };
        const gameCache = interaction.client.custom.cache.games.get(interaction.guildId);

        if (gameCache.has(interaction.user.id)) return interaction.reply({
            ephemeral: true,
            content: `You are still playing **${gameCache.get(interaction.user.id)}**. Please finish your previous games first.`
        });
        gameCache.set(interaction.user.id, subcommand);
        return gameModules[subcommand](interaction);
    }
};
