'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');

const command = new SlashCommandBuilder()
.setName('event-game')
.setDescription('Guess the flags (mini-game, not recorded)');

/**
 * EVENT COMMAND
 * @type {Object}
 */
const eventName = 'Guess the Country!';
const eventDescription = 'Guess the country from their flags!'

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        // return interaction.reply({
        //     ephemeral: true,
        //     content: '❌ There is no ongoing event (for now)!'
        // });

        if (client.custom.cache.eventGame.has(interaction.user.id)) return interaction.reply({
            ephemeral: true,
            content: `You have an ongoing session! Please try to finish that first!`
        });

        client.custom.cache.eventGame.set(interaction.user.id, []);

        return interaction.reply({
            embeds: [ new MessageEmbed()
                .setColor('ORANGE')
                .setTitle(`EVENT NAME: ${eventName}`)
                .setDescription(eventDescription)
            ],
            components: [ new MessageActionRow().addComponents(
                new MessageButton()
                .setCustomId('EVENTGAME:NEXT')
                .setLabel('Start')
                .setStyle('SUCCESS')
            )]
        });
    }
}
