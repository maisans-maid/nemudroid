'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const baseURI = 'https://some-random-api.ml/canvas'

const command = new SlashCommandBuilder()
.setName('image')
.setDescription('Avatar Image Manipulation (service provided by some-random-api)')
.addStringOption(option => option
    .setName('type')
    .setDescription('Type of this image manipulation')
    .addChoices([
        ['Imprison', 'jail'], //png
        ['Komrade', 'comrade'], //png
        ['Mission Passed [GTA]', 'passed'],  //png
        ['Pixelate', 'pixelate'],  //png
        ['Simp Card', 'simpcard'],  //png
        ['Triggered', 'triggered'], //gif
        ['Wasted [GTA]', 'wasted'],  //png
    ])
    .setRequired(true)
)
.addUserOption(option => option
    .setName('user')
    .setDescription('The user you want to generate the image for (Leaving blank uses yours)')
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: (client, interaction) => interaction.reply({
        files: [{
            attachment: `${baseURI}/${interaction.options.getString('type')}?avatar=${(interaction.options.getUser('user') || interaction.user).displayAvatarURL({ format: 'png' })}`,
            name: `${interaction.options.getString('type')}.${interaction.options.getString('type') !== 'triggered' ? 'png' : 'gif'}`
        }]
    }).catch(e => interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${e.message})`
    }))
};
