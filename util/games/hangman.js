'use strict';

const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const model = require('../../models/userSchema.js');
const _ = require('lodash');

module.exports = async function(interaction){
    return interaction.reply({
        ephemeral: true,
        content: ':x: This game is unplayable as it is still being developed! Sorry for the inconvenience!'
    });
};
