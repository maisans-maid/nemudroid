'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, Collection } = require('discord.js');
const petPetGif = require('pet-pet-gif');

const command = new SlashCommandBuilder()
.setName('pet')
.setDescription('Pet the user (From the PETTHE meme template)')
.addUserOption(option => option
    .setName('user')
    .setDescription('The user to pet')
    .setRequired(true)
)
.addStringOption(option => option
    .setName('speed')
    .setDescription('The speed of the petting.')
    .addChoices([
        [ 'Insanely Slow', '200'],
        [ 'Slower', '50' ],
        [ 'Slow', '30' ],
        [ 'Normal', '20' ],
        [ 'Fast', '15' ]
    ])
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        await interaction.deferReply();

        const user = interaction.options.getUser('user');
        const delay = Number(interaction.options.getString('speed') || 20);
        const avatar = user.displayAvatarURL({ format: 'png', size: 128 });
        const attachment = await petPetGif(avatar, { delay });

        return interaction.editReply({ files: [{ name: 'pet-pet.gif', attachment }] });
    }
};
