'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

const model = require('../models/guildSchema.js');
const ticketEnable = require('../processes/ticket-tool/ticket.enable.js');
const reasonAdd = require('../processes/ticket-tool/reason.add.js');
const reasonEdit = require('../processes/ticket-tool/reason.edit.js');
const reasonRemove = require('../processes/ticket-tool/reason.remove.js');

const command = new SlashCommandBuilder()
.setName('setupticketsupport')
.setDescription('Sets the support system for this server')
.addSubcommand(subcommand => subcommand
    .setName('enable')
    .setDescription('Enable the ticket support system')
    .addChannelOption(option => option
        .setName('category-channel')
        .setDescription('The category channel this support system belongs to')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('add-reason')
    .setDescription('Add a support reason (only use the ticket system for...)')
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason to add')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('remove-reason')
    .setDescription('Removes a support reason (only use the ticket system for...)')
    .addIntegerOption(option => option
        .setName('reason')
        .setDescription('The reason to remove (The number as it appears on the list)')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('edit-reason')
    .setDescription('Edits a support reason (only use the ticket system for...)')
    .addIntegerOption(option => option
        .setName('reason')
        .setDescription('The reason to edit (The number as it appears on the list)')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('new-reason')
        .setDescription('The new reason')
        .setRequired(true)
    )
)

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        if (!interaction.member.permissions.has('MANAGE_GUILD')){
            return interaction.reply({
                ephemeral: true,
                content: '❌ You have no permission to manage this server!'
            });
        };

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'enable'){
            return ticketEnable(client, interaction);
        };

        const profile = await model.findByIdOrCreate(interaction.guildId).catch(e => e);

        if (profile instanceof Error){
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${profile.message}`
            });
        };

        if (!profile.channels.supportCategoryId){
            return interaction.reply({
                ephemeral: true,
                content: '⚠ The support system has not been set up yet. Set it up by using the `enable` subcommand!'
            });
        };

        if (!interaction.guild.channels.cache.get(profile.channels.supportCategoryId)){
            return interaction.reply({
                ephemeral: true,
                content: '⚠ The support system category channel was nowhere to be found. Please reenable it by using the `enable` subcommand!'
            });
        };

        if (subcommand === 'add-reason'){
            return reasonAdd(client, interaction, profile);
        };

        if (subcommand === 'remove-reason'){
            return reasonRemove(client, interaction, profile);
        };

        if (subcommand === 'edit-reason'){
            return reasonEdit(client, interaction, profile);
        };
    }
};
