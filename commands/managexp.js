'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { ModalBuilder, ModalField } = require('discord-modal');
const uModel = require('../models/userSchema.js');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('managexp')
.setDescription('Manage xp in your server')
.addSubcommandGroup(subcommandGroup => subcommandGroup
    .setName('channels')
    .setDescription('Manage XP collection on various channels')
    .addSubcommand(subcommand => subcommand
        .setName('blacklist')
        .setDescription('Prevent the bot from collecting XP on the provided channel')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('The channel to modify.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('whitelist')
        .setDescription('Allow the bot from collecting XP on the provided channel')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('The channel to modify.')
            .setRequired(true)
        )
    )
)
.addSubcommandGroup(subcommandGroup => subcommandGroup
    .setName('users')
    .setDescription('Manage user\'s xp')
    .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add xp to the selected user')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user you want to add XP.')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('amount')
            .setDescription('The amount of XP to add')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('subtract')
        .setDescription('Subtract xp from the selected user')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user you want to subtract XP.')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('amount')
            .setDescription('The amount of XP to subtract')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('reset')
        .setDescription('Reset the selected user\'s XP')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user you want to reset XP.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('reset-all')
        .setDescription('Reset all user\'s XP for this server')
    )
);

module.exports = {
    builder: command,
    permissions: new Permissions('ADMINISTRATOR'),
    execute: async(client, interaction) => {

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel');
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        if (subcommandGroup === 'users'){
            if (subcommand === 'reset-all'){
                const modal = new ModalBuilder()
                    .setCustomId(`XP_RESET:${interaction.guildId}`)
                    .setTitle('RESET XP FOR ALL MEMBERS?')
                    .addComponents(
                        new ModalField()
                            .setLabel('Type "RESET" to continue (Case-sensitive).')
                            .setStyle('short')
                            .setPlaceholder('Type here...')
                            .setCustomId('reset')
                            .setRequired(true)
                    );
                return client.modal.open(interaction, modal);
            } else {
                if ((subcommand !== 'reset') && amount < 1) return interaction.reply({
                    ephemeral: true,
                    content: '❌ Amount must be any non-negative number'
                });
                if ((subcommand !== 'reset') && amount > 1_000_000) return interaction.reply({
                    ephemeral: true,
                    content: '❌ To prevent a recursive loop, amount added must not exceed 1,000,000 at a time.'
                });
                if (user.bot) return interaction.reply({
                    ephemeral: true,
                    content: '❌ Bot cannot have XPs'
                });
                const uDocument = await uModel.findByIdOrCreate(user.id);
                if (uDocument instanceof Error) return interaction.reply({
                    ephemeral: true,
                    content: `❌ Error: ${uDocument.message}`
                });
                let response;
                switch (subcommand){
                    case 'add':
                        uDocument.addXP(interaction.guildId, amount);
                        response = `${user}'s XP was added by **${amount}**. Role rewards will only be added on the next level-up!`
                    break;
                    case 'subtract':
                        uDocument.addXP(interaction.guildId, -amount);
                        response = `${user}'s XP was subtracted by **${amount}**. Obtained role rewards will not be removed (if any).`
                    break;
                    case 'reset':
                        uDocument.addXP(interaction.guildId, -uDocument.getXP(interaction.guildId).xp)
                        response = `${user}'s XP was reset! Obtained role rewards will not be removed (if any)`
                    break;
                };
                return uDocument.save().then(() => interaction.reply({
                    ephemeral: true, content: response
                }))
                .catch(e => interaction.reply({
                    ephemeral: true,
                    content: `Error: ${e.message.split(':').slice(2).join('')}`
                }));
            };
        };

        if (subcommandGroup === 'channels'){
            const gDocument = await gModel.findByIdOrCreate(interaction.guildId);
            if (gDocument instanceof Error) return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${gDocument.message}`
            });
            let response, before, after;
            let channels = [channel.id];
            if (channel.type === 'GUILD_CATEGORY'){
                channels = channel.children.map(c => c.id);
            };
            switch(subcommand){
                case 'blacklist':
                    gDocument.channels.xpBlacklist = [...new Set([gDocument.channels.xpBlacklist, channels].flat())];
                    response = `${new Intl.ListFormat('en').format(channels.map(x => `<#${x}>`))} is/are now xp-blacklisted!`
                break;
                case 'whitelist':
                    gDocument.channels.xpBlacklist = gDocument.channels.xpBlacklist.filter(x => !channels.includes(x));
                    response = `${new Intl.ListFormat('en').format(channels.map(x => `<#${x}>`))} is/are now xp-whitelisted!`
                break;
            };
            return gDocument.save().then(() => interaction.reply({
                ephemeral: true, content: response
            }))
            .catch(e => interaction.reply({
                ephemeral: true,
                content: `Error: ${e.message.split(':').slice(2).join('')}`
            }));
        };
    }
};
