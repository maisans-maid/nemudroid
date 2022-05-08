const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const deployCommands = require('../utility/Commands.deploy.js');

const command = new SlashCommandBuilder()
.setName('init')
.setDescription('Initialize bot / Sync commands.');

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        try {
            await deployCommands(client, interaction.guild);
            return interaction.reply({
                ephemeral: true,
                content: '☑ Successfully registered application (/) commands.'
            });
        } catch (err) {
          console.log(err)
          return interaction.reply({
              ephemeral: true,
              content: '❌ Failed to register application (/) commands. ' + err.message
          });
        };
    }
};
