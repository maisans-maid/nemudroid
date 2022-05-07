'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('configs')
.setDescription('Display this server\'s configuration');

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const profile = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (profile instanceof Error){
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${profile.message}`
            });
        };

        function getChannel(id){
            return interaction.guild.channels.cache.get(id)?.toString() || '*Not set*';
        };

        function getRole(id){
            return interaction.guild.roles.cache.get(id)?.toString() || '*Not set*';
        };

        return interaction.reply({
            embeds: [
                new MessageEmbed()
                .setTimestamp()
                .setAuthor({
                    name: `${interaction.guild.me.displayName}'s Server Configuration for ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setColor([255,247,125])
                .setFooter({ text: '⚠ Blacklist-channel is locked for maintenance.' })
                .addFields([
                    {
                        name: 'Channel Configuration',
                        value: [
                             `-\u2000 **Birthday Announcement**: ${getChannel(profile.channels.birthday)}`,
                             `-\u2000 **Deleted Messages Archive**: ${getChannel(profile.channels.clearMessages)}`,
                             `-\u2000 **Introduction Channel**: ${getChannel(profile.channels.introduction)}`,
                             `-\u2000 **Levelup Notifications**: ${getChannel(profile.channels.levelUp)}`,
                             `-\u2000 **Support Category Channel**: ${getChannel(profile.channels.supportCategoryId)}`,
                             `-\u2000 **System (Bot) Logs** *(Recommended)*: ${getChannel(profile.channels.logger)}`,
                             `-\u2000 **Verification Channel**: ${getChannel(profile.channels.verification)}`,
                             `-\u2000 **Welcome Greeter Chanel**: ${getChannel(profile.channels.welcome)}`,
                             '*These can be reconfigured via the `\setchannel` command*'
                        ].join('\n'),
                    },
                    {
                        name: 'XP-Blacklisted Channels',
                        value: [
                            new Intl.ListFormat('en-us').format(profile.channels.xpBlacklist.map(x => `<#${x}>`)) || '*Not Set*',
                            '*These can be reconfigured via the `\managexp channels` command*'
                        ].join('\n')
                    },
                    {
                        name: 'Role Configuration',
                        value: [
                            `-\u2000 **Verification Role**: ${getRole(profile.roles.verification)}`,
                            '*These can be reconfigured via the `\setrole` command*'
                        ].join('\n'),
                    },
                    {
                        name: 'Level Role Rewards',
                        value: profile.roles.rewards.map(x => `Level **${x.level}** = ${getRole(x.role)}`).join('\n') || '*No rewards has been configured for this server*.'
                    },
                    {
                        name: 'Default Text Configuration',
                        value: [
                            `-\u2000 **Welcome Greeter Text**: ${profile.text.welcome || '*Unset*'}`,
                            '*These can be reconfigured via the `\setdefaulttext` command*'
                        ].join('\n'),
                    },
                    {
                        name: 'Support Reasons',
                        value: [
                            profile.text.supportReasons.map(x => `-\u2000 ${x}`).join('\n') || '*Unset*',
                            '*These can be reconfigured via the `\setupticketsupport` command*'
                        ].join('\n')
                    },
                ])
            ]
        })

    }
}
