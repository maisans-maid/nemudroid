const { SlashCommandBuilder } = require('@discordjs/builders');
const { User } = require('discord.js');
const model = require('../models/userSchema.js');
const guildModel = require('../models/guildSchema.js');

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

const command = new SlashCommandBuilder()
.setName('birthday')
.setDescription('Set or view user birthday')
.addSubcommand(subcommand => subcommand
    .setName('set')
    .setDescription('Set your own birthday')
    .addIntegerOption(option => option
        .setName('day')
        .setDescription('The day of your birthday')
        .setRequired(true)
    )
    .addIntegerOption(option => option
        .setName('month')
        .setDescription('The month of your birthday')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View user\'s birthday')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user\'s birthday to view')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('restrict')
    .setDescription('Restrict other users from querying your birthday')
    .addBooleanOption(option => option
        .setName('boolean')
        .setDescription('Set whether to restrict your birthday from being viewed by others')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('set-channel')
    .setDescription('Set the channel for logging birthday events')
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('The channel to use for logging birthday events. Leave blank to disable.')
    )
);

module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        const user = interaction.options.getUser('user');
        const restrict = interaction.options.getBoolean('boolean');

        if (interaction.options.getSubcommand() === 'set'){
            const day = interaction.options.getInteger('day');
            const month = interaction.options.getInteger('month');
            const profile = await model.findById(interaction.user.id) ||
                new model({ _id: interaction.user.id });

            if (profile instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content: `<:nemu_confused:883953720373682208> Error: ${profile.message}`
                });

            profile.birthday.day   = day;
            profile.birthday.month = month;

            let content = `<:nemu_chibi_prod:907495598075306014> Successfully set your birthday to **${months[month - 1]} ${day}**!`;

            if (!profile.birthday.isRestricted)
                content += '\n<:nemu_confused:883953720373682208> Your birthday viewing is not restricted. This means that other users can view when your birthday is. To restrict it, use the command `/birthday restrict true`'

            return profile
            .save()
            .then(() => interaction.reply({
                ephemeral: true,
                content
            }))
            .catch(e => interaction.reply({
                ephemeral: true,
                content: `<:nemu_confused:883953720373682208> Error: ${e.message}`
            }));
        };

        if (interaction.options.getSubcommand() === 'set-channel'){
            if (!interaction.memberPermissions.has('MANAGE_GUILD'))
                return interaction.reply({
                    ephemeral: true,
                    content: '<:nemu_confused:883953720373682208> You have no permission to use this command!'
                });

            let channel = interaction.options.getChannel('channel');

            if (channel){
                if (!channel.isText())
                    return interaction.reply({
                        ephemeral: true,
                        content: '<:nemu_confused:883953720373682208> The selected channel is not a Text-Channel!'
                    });

                if (!channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'ATTACH_FILES']))
                    return interaction.reply({
                        ephemeral: true,
                        content: '<:nemu_confused:883953720373682208> The selected channel cannot be used because I have no Send Messages or Attach Files permissions!'
                    });

                channel = channel.id;
            };

            const profile = await guildModel.findById(interaction.guildId) ||
                new guildModel({ _id: interaction.guildId });

            if (profile instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content: `<:nemu_confused:883953720373682208> Error: ${profile.message}`
                });

            profile.birthday.channel = channel || null;

            return profile
            .save()
            .then(() => interaction.reply({
                ephemeral: true,
                content: `<:nemu_chibi_prod:907495598075306014> Successfully ${
                    profile.birthday.channel
                        ? `set the birthday log channel to <#${profile.birthday.channel}>!`
                        : 'removed the birthday log channel'
                }`
            }))
            .catch(e => interaction.reply({
                ephemeral: true,
                content: `<:nemu_confused:883953720373682208> Error: ${e.message}`
            }));
        };

        if (user instanceof User){
            const profile = await model.findById(user.id) ||
                new model({ _id: user.id });

            if (profile instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content: `<:nemu_confused:883953720373682208> Error: ${profile.message}`
                });

            if (!profile.birthday.day || !profile.birthday.month)
                return interaction.reply({
                    ephemeral: true,
                    content: `<:nemu_confused:883953720373682208> ${user} has not set their birthday yet!`
                });

            if (profile.birthday.isRestricted)
                return interaction.reply({
                    ephemeral: true,
                    content: `<:nemu_confused:883953720373682208> ${user} does not want you to know their birthday.`
                });

            return interaction.reply({
                content: `${user}'s Birthday is on **${months[profile.birthday.month - 1]} ${profile.birthday.day}**`,
                allowedMentions: { parse: [] }
            });
        };

        if (typeof restrict === 'boolean'){
            const profile = await model.findById(interaction.user.id) ||
                new model({ _id: interaction.user.id });

            if (profile instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content: `<:nemu_confused:883953720373682208> Error: ${profile.message}`
                });

            profile.birthday.isRestricted = restrict;
            let content = `<:nemu_chibi_prod:907495598075306014> Successfully ${restrict ? 'Enabled' : 'Disabled'} birthday strict mode!`;

            if (!profile.birthday.day || !profile.birthday.month)
                content += '\n<:nemu_confused:883953720373682208> You haven\'t set your birthday yet. Use `/birthday set` to set your birthday.'

            return profile
            .save()
            .then(() => interaction.reply({
                ephemeral: true,
                content
            }))
            .catch(e => interaction.reply({
                ephemeral: true,
                content: `<:nemu_confused:883953720373682208> Error: ${e.message}`
            }));
        };
    }
};
