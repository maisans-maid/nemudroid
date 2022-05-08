'use strict';

const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');

const command = new ContextMenuCommandBuilder()
    .setName('View Permissions')
    .setType(2)

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: (client, interaction) => {

        const member = interaction.options.getMember('user');
        const allowed = Object.entries(member.permissions.serialize()).filter(([k,v]) => v).map(([k,v]) => k.split('_').map(x => x.charAt(0) + x.slice(1).toLowerCase()).join(' ')).sort();
        const denied = Object.entries(member.permissions.serialize()).filter(([k,v]) => !v).map(([k,v]) => k.split('_').map(x => x.charAt(0) + x.slice(1).toLowerCase()).join(' ')).sort();
        const embed = new MessageEmbed()
            .setColor([255,247,125])
            .setTitle(`${member.displayName}'s Permissions`)
            .addField('Allowed Permissions', new Intl.ListFormat('en-us').format(allowed) || 'None')
            .addField('Denied Permissions', new Intl.ListFormat('en-us').format(denied) || 'None')
            .setFooter({ text: 'Note that some Permissions may be affected by Channel Permission Overrides' });

        return interaction.reply({ ephemeral: true, embeds: [embed] });
    }
};
