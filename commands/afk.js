'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, Collection } = require('discord.js');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('afk')
.setDescription('Let other people know you\'re Away From Keyboard.' )
.addStringOption(option => option
    .setName('display-text')
    .setDescription('The text to display whenever somebody pings you')
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        if (!interaction.guild.me.permissions.has('MANAGE_NICKNAMES')){
            return interaction.reply({
                ephemeral: true,
                content: '❌ I need the **Manage Nicknames** permissions to be able to perform this command.'
            });
        };

        const displayText = interaction.options.getString('display-text') || null;
        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error){
            return interaction.reply({
                ephemeral: true,
                content: `<:nemu_confused:883953720373682208> Error: ${uDocument.message}`
            });
        };

        if (gDocument.afks.some(user => user.id === interaction.user.id)){
            const index = gDocument.afks.findIndex(user => user.id === interaction.user.id);
            gDocument.afks.splice(index, 1)
        };

        gDocument.afks.push({ id: interaction.user.id, displayText });
        return gDocument.save().then(async () => {
            let guildCollection = client.custom.cache.afkUsers.get(interaction.guildId);
            if (!guildCollection) guildCollection = client.custom.cache.afkUsers.set(interaction.guildId, new Collection()).get(interaction.guildId)
            guildCollection.set(interaction.user.id, displayText);
            await interaction.member.setNickname(`[AFK] ${interaction.member.displayName}`.substr(0, 32)).catch(e => e);
            return interaction.reply({
                ephemeral: true,
                content: `Set your status to AFK. Display-text set to ${displayText || 'none'}.`
            })
        });
    }
};
