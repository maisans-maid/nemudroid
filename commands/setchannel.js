'use strict';

const { Permissions } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { guildSchemaPartial } = require('../utility/Typedefs.js');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('setchannel')
.setDescription('Sets the various channel configurations for this server.')
.addSubcommand(subcommand => subcommand
    .setName('birthday')
    .setDescription('Sets the selected channel for logging birthday events.')
    .addChannelOption(option => option
        .setName('text-channel')
        .setDescription('The text channel to use. Leave blank to remove channel.')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('clearmessage')
    .setDescription('Set the selected channel as file dump for message history (make sure the channel is private).')
    .addChannelOption(option => option
        .setName('text-channel')
        .setDescription('The text channel to use. Leave blank to remove channel.')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('introduction')
    .setDescription('Set the selected channel as default introduction channel (used by /intro command)')
    .addChannelOption(option => option
        .setName('text-channel')
        .setDescription('The text channel to use. Leave blank to remove channel.')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('levelup')
    .setDescription('Set the selected channel to send a levelup notification for all members')
    .addChannelOption(option => option
        .setName('text-channel')
        .setDescription('The text channel to use. Leave blank to remove channel.')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('logger')
    .setDescription('Set the selected channel to send a message for sending audit logs.')
    .addChannelOption(option => option
        .setName('text-channel')
        .setDescription('The text channel to use. Leave blank to remove channel.')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('welcomemessage')
    .setDescription('Set the selected channel to send a message everytime a member joins this server.')
    .addChannelOption(option => option
        .setName('text-channel')
        .setDescription('The text channel to use. Leave blank to remove channel.')
    )
)

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('text-channel');

        if (channel && !channel.isText()) return interaction.reply({
            ephemeral: true,
            content: '❌ The selected channel is not a `text-channel`!'
        });


        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error)  return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${gDocument.message}`
        });

        let response;

        if (subcommand === 'birthday'){
            gDocument.channels.birthday = channel ? channel.id : null;
            if (gDocument.channels.birthday === null){
                response = '✅ Successfully disabled birthday announcement feature.'
            } else {
                response = `✅ Birthday celebrants will now be announced at at ${channel}!`
                if (!channel.permissionsFor(client.user).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'])){
                    response += '\n⚠ Please make sure my **View Channel, Send Messages, **and **Attach Files** Permissions are enabled on that channel!'
                };
            };
        };

        if (subcommand === 'clearmessage'){
            gDocument.channels.clearMessages = channel ? channel.id : null;
            if (gDocument.channels.clearMessages === null){
                response = '✅ Successfully disabled clearmessage history upload feature.'
            } else {
                response = `✅ Deleted message history will now be archived at ${channel}!`
                if (!channel.permissionsFor(client.user).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'])){
                    response += '\n⚠ Please make sure my **View Channel, Send Messages, **and **Attach Files** Permissions are enabled on that channel!'
                };
            };
        };

        if (subcommand === 'introduction'){
            gDocument.channels.introduction = channel ? channel.id : null;
            if (gDocument.channels.introduction === null){
                response = '✅ Introduction channel has been disabled!'
            } else {
                response = `✅ Introduction channel has been set to ${channel}!`
                if (!channel.permissionsFor(client.user).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'])){
                    response += '\n⚠ Please make sure my **View Channel, Send Messages, **and **Attach Files** Permissions are enabled on that channel!'
                };
            };
        };

        if (subcommand === 'levelup'){
            gDocument.channels.levelUp = channel ? channel.id : null;
            if (gDocument.channels.levelUp === null){
                response = '✅ Successfully disabled the levelup notification.'
            } else {
                response = `✅ Users that level up will be notified at ${channel}.`
                if (!channel.permissionsFor(client.user).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'])){
                    response += '\n⚠ Please make sure my **View Channel, Send Messages, **and **Attach Files** Permissions are enabled on that channel!'
                };
            };
        };

        if (subcommand === 'logger'){
            gDocument.channels.logger = channel ? channel.id : null;
            client.custom.cache.guildSchemaPartials.set(interaction.guildId, new guildSchemaPartial(interaction.guild, gDocument));
            if (gDocument.channels.logger === null){
                response = '✅ Successfully disabled the audit-logging feature.'
            } else {
                response = `✅ Important logs will be displayed at ${channel}.`
                if (!channel.permissionsFor(client.user).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'])){
                    response += '\n⚠ Please make sure my **View Channel, Send Messages, Attach Files, **and **Embed Links** Permissions are enabled on that channel!'
                };
            };
        };

        if (subcommand === 'welcomemessage'){
            gDocument.channels.welcome = channel ? channel.id : null;
            if (gDocument.channels.welcome === null){
                response = '✅ Successfully disabled the welcome message feature.'
            } else {
                response = '✅ Successfully enabled the welcome message feature.'
                if (!channel.permissionsFor(client.user).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'])){
                    response += '\n⚠ Please make sure my **View Channel, Send Messages, **and **Attach Files** Permissions are enabled on that channel!'
                };
            };
        };

        return gDocument.save()
        .then(() => interaction.reply({
            content: response,
            ephemeral: true
        }))
        .catch(err => interaction.reply({
            content: `❌ Oops! Something went wrong: ${err.message}`,
            ephemeral: true
        }));
    }
};
