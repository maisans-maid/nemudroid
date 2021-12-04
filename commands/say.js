const { SlashCommandBuilder, hideLinkEmbed } = require('@discordjs/builders');
const { FLAGS } = require('discord.js').Permissions;

const command = new SlashCommandBuilder()
.setName('say')
.setDescription('Say something using the bot')
.addStringOption(option => option
    .setName('content')
    .setDescription('The content of the message to be sent.')
    .setRequired(true)
)
.addChannelOption(option => option
    .setName('channel')
    .setDescription('The channel you want the message to be sent. Defaults to the current channel.')
)
const allowedPermissions = (Guild) => Guild.roles.cache
    .filter(role => role.permissions.has('MANAGE_GUILD'))
    .map(role => Object.assign({},{
        id: role.id,
        type: 'ROLE',
        permission: true
    }));

const permalink = 'https://discord.js.org/#/docs/main/stable/typedef/TextBasedChannels';

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const content = interaction.options.getString('content');

        const channel = interaction.options
            .getChannel('channel') ||
            interaction.channel;

        if (!channel.isText())
            return interaction.reply({
                ephemeral: true,
                content: `❌ The selected channel is not a [**\`Text-based Channel\`**](${hideLinkEmbed(permalink)})`
            });

        return channel.send(content)
            .then(() => interaction
                .reply({
                    ephemeral: true,
                    content: '✔️ Message has been delivered!'
                })
            )
            .catch(error => interaction
                .reply({
                    ephemeral: true,
                    content: `❌ Error: ${error.message}`
                })
            );
    }
};
