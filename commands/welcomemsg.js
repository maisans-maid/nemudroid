const { SlashCommandBuilder, hideLinkEmbed, bold } = require('@discordjs/builders');
const { TextChannel } = require('discord.js');
const { FLAGS } = require('discord.js').Permissions;
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('welcomemsg')
.setDescription('Set the behavior of the welcome message!')

.addSubcommandGroup(group => group
    .setName('manage')
    .setDescription('Manage the channel and/or the text-message for this feature.')
    .addSubcommand(subcommand => subcommand
        .setName('channel')
        .setDescription('Set the channel for the welcome message!')
        .addChannelOption(option => option
            .setName('target')
            .setDescription('The channel to use for this feature!')
            .setRequired(true)
        )
    ) // channel
    .addSubcommand(subcommand => subcommand
        .setName('message')
        .setDescription('Adds/Disable Text message inclusion for the welcome message.')
        .addStringOption(option => option
            .setName('action')
            .setDescription('What to do with the text message.')
            .addChoices([
                ['Set Text-Message', 'set'],
                ['Disable Text-Message', 'disable'],
            ])
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('content')
            .setDescription('The content of the message to include.')
        )
    ) // message
)
.addSubcommand(subcommand => subcommand
    .setName('enable')
    .setDescription('Enable this feature.')
 )
.addSubcommand(subcommand => subcommand
    .setName('disable')
    .setDescription('Disable this feature')
)
.addSubcommand(subcommand => subcommand
    .setName('test')
    .setDescription('Test the message')
);


module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        if (!interaction.memberPermissions.has(FLAGS.MANAGE_GUILD))
            return interaction.reply({
                ephemeral: true,
                content: '❌ You are not allowed to use this command!'
            });

        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('target');
        const action = interaction.options.getString('action');

        if (subcommand === 'test'){
            client.emit('guildMemberAdd', interaction.member);
            return interaction.reply({
                ephemeral: true,
                content: '✔️ Message was sent!'
            });
        };

        let profile = await model
                .findById(interaction.guildId)
                .catch(err => err) ||
            await new model({ _id: interaction.guildId })
                .save()
                .catch(err => err);

        if (profile instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${document.message}`
            });

        function missingPerm(channel){
            return new Intl.ListFormat('en-us')
                .format(channel.permissionsFor(client.user)
                    .missing([
                        FLAGS.VIEW_CHANNEL,
                        FLAGS.SEND_MESSAGES,
                        FLAGS.ATTACH_FILES
                    ])
                    .flatMap(PermissionFlag => PermissionFlag
                        .split('_')
                        .map(a => bold(a.charAt(0) + a.slice(1).toLowerCase()))
                        .join(' ')
                    )
                );
        };

        if (['enable', 'disable'].includes(subcommand)){
            const btn = {
                enable:  true,
                disable: false
            };

            const channel = interaction.guild.channels.cache
                .get(profile.greeter.welcome.channel);

            let message = '';
            const missingPermissions = missingPerm(channel);

            if (subcommand === 'enable' && !channel)
                message += '⚠️ Channel not set. Please set the channel to activate this feature.';

            if (subcommand === 'enable' && channel && missingPermissions.length)
                message += `⚠️ I may not be able to send messages to ${channel} because of missing ${missingPermissions} Permission.`

            if (profile.greeter.welcome.isEnabled === btn[subcommand])
                return interaction.reply({
                    ephemeral: true,
                    content: `⚠️ The **welcomemsg feature** has already been ${subcommand.toUpperCase()}D!\n${message}`
                });

            profile.greeter.welcome.isEnabled = !profile.greeter.welcome.isEnabled;

            return profile
                .save()
                .then(() => {
                    client.localCache.guildSchema.set(
                        interaction.guild.id,
                        model(profile).toJSON()
                    );
                    return interaction.reply({
                        ephemeral: true,
                        content: `✔️ The **welcomemsg feature** has been ${subcommand}d!\n${message}`
                    });
                })
                .catch(error => interaction
                    .reply({
                        ephemeral: true,
                        content: `❌ Error: ${error.message}`
                    })
                );
        };

        if (subcommand === 'channel'){
            const link = hideLinkEmbed('https://discord.js.org/#/docs/main/stable/typedef/TextBasedChannels');

            if (!(channel instanceof TextChannel))
                return interaction.reply({
                    ephemeral: true,
                    content: `❌ The selected channel is not a [**\`Text-based Channel\`**](${link})`
                });

            let message = '';
            const missingPermissions = missingPerm(channel);

            if (subcommand === 'enable' && channel && missingPermissions.length)
                message += `\n⚠️ I may not be able to send messages to ${channel} because of missing ${missingPermissions} Permission.`

            profile.greeter.welcome.isEnabled = true;
            profile.greeter.welcome.channel   = channel.id;

            return profile
                .save()
                .then(() => {
                    client.localCache.guildSchema.set(
                        interaction.guild.id,
                        model(profile).toJSON()
                    );
                    return interaction.reply({
                        ephemeral: true,
                        content: `✔️ Welcomemsg set to ${channel}!${message}`
                    });
                })
                .catch(error => interaction
                    .reply({
                        ephemeral: true,
                        content: `❌ Error: ${error.message}`
                    })
                );
        };

        if (subcommand === 'message'){
            if (action === 'set' && typeof content !== 'string')
                return interaction.reply({
                    ephemeral: true,
                    content: '⚠️ You need to provide the message content. You can use modifiers as well.'
                });

            profile.greeter.welcome.message.text = action === 'set'
                ? content.value
                : null;

            profile.greeter.welcome.message.isEnabled = action === 'set'
                ? true
                : false;

            return profile
                .save()
                .then(() => {
                    client.localCache.guildSchema.set(
                        interaction.guild.id,
                        model(profile).toJSON()
                    );
                    return interaction.reply({
                        ephemeral: true,
                        content: `✔️ Text message has been ${
                            action === 'set'
                                ? 'added to'
                                : 'removed from'
                            } welcomemsg!!`
                    });
                })
                .catch(error => interaction
                    .reply({
                        ephemeral: true,
                        content: `❌ Error: ${error.message}`
                    })
                );
        };
    }
};
