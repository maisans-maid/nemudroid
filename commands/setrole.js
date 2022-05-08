'use strict';

const { Permissions } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { guildSchemaPartial } = require('../utility/Typedefs.js');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('setrole')
.setDescription('Sets the various channel configurations for this server.')
.addSubcommand(subcommand => subcommand
    .setName('verify')
    .setDescription('Set the selected role as the verification role')
    .addRoleOption(option => option
        .setName('role')
        .setDescription('The role to use. Leave blank to remove role.')
    )
)

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const subcommand = interaction.options.getSubcommand();
        const role = interaction.options.getRole('role');

        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error)  return interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${gDocument.message})`
        });

        let response;
        if (subcommand === 'verify'){
            gDocument.roles.verification = role ? role.id : null;
            client.custom.cache.guildSchemaPartials.set(interaction.guildId, new guildSchemaPartial(interaction.guild, gDocument));
            if (gDocument.roles.verification === null){
                response = '✅ Successfully disabled role verification'
            } else {
                response = `✅ Successfully set role ${role} as verification role`
            };
        };

        return gDocument.save()
        .then(() => interaction.reply({
            content: response,
            ephemeral: true
        }))
        .catch(err => interaction.reply({
            content: `❌ Oops! Something went wrong (${err.message})`,
            ephemeral: true
        }));
    }
}
