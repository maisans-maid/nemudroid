'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const sendRuleEditUI = require('../utility/Rules.components.config.js');

const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('setdefaulttext')
.setDescription('Set the various text configurations for this server.')
.addSubcommand(subcommand => subcommand
    .setName('welcome-message')
    .setDescription('Sets the provided text as the welcome-message content.')
    .addStringOption(option => option
        .setName('message')
        .setDescription('The message to use. Leave blank to remove text')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('rules')
    .setDescription('Open the rules config editor interface')
);

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const subcommand = interaction.options.getSubcommand();
        const content = interaction.options.getString('message');

        // These subcommands do not require the database data, therefore they are
        // checked first before fetching database to lessen database operations
        if (subcommand === 'rules'){
            return sendRuleEditUI(interaction);
        };

        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${gDocument.message})`
        });

        let response;
        if (subcommand === 'welcome-message'){
            gDocument.text.welcome = content || null;
            if (gDocument.text.welcome === null){
                response = '✅ Successfully removed the text for welcome messages!';
            } else {
                response = `✅ Successfully added text for welcome messages!`;
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
