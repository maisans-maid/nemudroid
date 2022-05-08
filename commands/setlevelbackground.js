'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const uModel = require('../models/userSchema.js');

const command = new SlashCommandBuilder()
.setName('setlevelbackground')
.setDescription('Set the background that appears in your level card')
.addStringOption(option => option
    .setName('url')
    .setDescription('The url of the background.')
    .setRequired(true)
)

module.exports = {
    builder: command,
    permissions: new Permissions('VIEW_CHANNEL'),
    execute: async (client, interaction) => {

        const url = interaction.options.getString('url');

        if (!/^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png|bmp)$/i.test(url)){
            return interaction.reply({
                ephemeral: true,
                content: 'Invalid Image URL. Please make sure the link leads to an image file. You can upload your image to hosting sites such as [imgur](<https://imgur.com>) and use the image link here.'
            });
        };

        const uDocument = await uModel.findByIdOrCreate(interaction.user.id).catch(e => e);
        if (uDocument instanceof Error){
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${uDocument.message}`
            });
        };

        uDocument.wallpaper = url;
        return uDocument.save().then(() => interaction.reply({
            ephemeral: true,
            content: 'Successfully saved the wallpaper!'
        }))
        .catch(error => interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${error.message}`
        }));
    }
};
