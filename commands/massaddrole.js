const { SlashCommandBuilder, channelMention } = require('@discordjs/builders');
const { Permissions: { FLAGS }, TextChannel } = require('discord.js');
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('massaddrole')
.setDescription('Adds a role to everyone in the server')
.addRoleOption(option => option
    .setName('add')
    .setDescription('The role to add')
    .setRequired(true)
)
.addRoleOption(option => option
    .setName('add-1')
    .setDescription('Additional role to add')
)
.addRoleOption(option => option
    .setName('add-2')
    .setDescription('Additional role to add')
)
.addRoleOption(option => option
    .setName('add-3')
    .setDescription('Additional role to add')
)
.addRoleOption(option => option
    .setName('add-4')
    .setDescription('Additional role to add')
)
.addRoleOption(option => option
    .setName('add-5')
    .setDescription('Additional role to add')
)

const allowedPermissions = (Guild) => Guild.roles.cache
    .filter(role => role.permissions.has(FLAGS.MANAGE_GUILD))
    .map(role => Object.assign({},{
        id: role.id,
        type: 'ROLE',
        permission: true
    }));

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const rolesToAdd = [ interaction.options.getRole('add') ];

        for (const id of ['1','2','3','4','5']){
            const optionalRole = interaction.options.getRole(`add-${id}`);
            if (optionalRole) rolesToAdd.push(optionalRole);
        };

        const automated = interaction.options.getRole('automate');

        await interaction.reply({
            ephemeral: true,
            content: 'Fetching user data...'
        });

        const members = await interaction.guild.members.fetch().catch(e => e);

        if (members instanceof Error){
            return interaction.followUp({
                ephemeral: true,
                content: 'An error occured while fetching user data: ' + members.message
            });
        };

        await interaction.followUp({
            ephemeral: true,
            content: 'Successfully fetched user data. Applying roles... (this may take a while)'
        });

        const errors = [];
        let success = false;

        for (const member of members.map(x => x)){
            const rolemanager = await member.roles.add(rolesToAdd).then(() => success = true).catch(e => e);
            await new Promise(resolve => setTimeout(() => resolve(), 250))
            if (rolemanager instanceof Error){
                errors.push(`- Couldn\'t add role(s) to ${member}: ${rolemanager.message}`);
            };
        };

        if (!success){
            return interaction.followUp({
                ephemeral: true,
                content: `**Operation failed**: \n${errors.join('\n').substr(0, 1900)}`
            });
        };

        return interaction.followUp({
            ephemeral: true,
            content: `Successfully added roles to everyone${errors.length ? ` with the following errors: ${errors.join('\n').substr(0, 1900)}` : '.'}`
        });
    }
};
