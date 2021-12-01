const { SlashCommandBuilder } = require('@discordjs/builders');
const { TextChannel, Permissions: { FLAGS }} = require('discord.js');
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('nemunnouncement')
.setDescription('Subscribe to nemu\'s stream announcements!')
.addChannelOption(option => option
    .setName('text-channel')
    .setDescription('The text channel to bind announcements to.')
    .setRequired(true)
)
.addRoleOption(option => option
    .setName('ping-role')
    .setDescription('The role to ping when sending nemu\'s announcements')
)

module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        if (!interaction.member.permissions.has('MANAGE_GUILD'))
            return interaction.reply({
                ephemeral: true,
                content: 'You have no permission to use this command!'
            });

        const channel = interaction.options.getChannel('text-channel');
        const role = interaction.options.getRole('ping-role');
        const errors = [];

        if (!(channel instanceof TextChannel))
            errors.push('The selected channel is not a Text-Channel!')

        if (!channel.permissionsFor(client.user).has([ 'VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS']))
            errors.push(
                'I don\'t have the following permission(s): ' +
                new Intl.ListFormat('en-us').format(
                    channel
                    .permissionsFor(client.user)
                    .missing([
                        FLAGS.VIEW_CHANNEL,
                        FLAGS.SEND_MESSAGES,
                        FLAGS.ATTACH_FILES,
                        FLAGS.EMBED_LINKS
                    ])
                    .flatMap(PermissionFlag => PermissionFlag
                        .split('_')
                        .map(a => a.charAt(0) + a.slice(1).toLowerCase())
                        .join(' ')
                    )
                )
            );

        if (errors.length)
            return interaction.reply({
                ephemeral: true,
                content: `Unable to set announcement channel for Nemu:\n${errors.map(x => `<:gj_cat:915561738559184957> ${x}`).join('\n')}`
            });

        await interaction.deferReply();

        const document = await model.findById(interaction.guildId) || new model({ _id: interaction.guildId });

        if (document instanceof Error)
            return interaction.editReply({
                ephemeral: true,
                content: `An error occured while processing your request: ${document.message}`
            });

        document.nemunnouncement.channel = channel.id;
        document.nemunnouncement.role = role?.id || null;

        return document
        .save()
        .then(() => interaction.editReply({
            ephemeral: true,
            content: `Successfully set the nemunnouncement channel to ${channel}. ${role ? 'Ping role is set to ' + role.toString() : ''}.`
        }))
        .catch(err => interaction.editReply({
            ephemeral: true,
            content: `An error occured while processing your request: ${err.message}`
        }));
    }
}
