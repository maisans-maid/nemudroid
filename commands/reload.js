const { SlashCommandBuilder } = require('@discordjs/builders');
const { join } = require('path');

const command = new SlashCommandBuilder()
.setName('reload')
.setDescription('Reload a specific command module')
.addStringOption(option => option
    .setName('command')
    .setDescription('The name of the command to reload')
    .setRequired(true)
)
const allowedPermissions = () => [{
    id: '545427431662682112',
    type: 'USER',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const commandName = interaction.options
            .getString('command');

        if (!client.commands.get(commandName.toLowerCase()))
            return interaction.reply({
                ephemeral: true,
                content: `❌ Command Module for **${commandName}** could not be found.`
            });

        try {
            delete require.cache[
                require.resolve(join(
                    __dirname,
                    commandName
                ))
            ];

            const cmdModule = require(join(
                __dirname,
                commandName
            ));

            client.commands.set(
                cmdModule.builder.name,
                cmdModule.execute
            );

            return interaction.reply({
                ephemeral: true,
                content: `Command **${commandName}** has been reloaded.`
            });
        } catch (err) {
            return interaction.reply({
                ephemeral: true,
                content: `❌ ${err.message}`
            });
        };
    }
};
