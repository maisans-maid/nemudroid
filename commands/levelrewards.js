'use strict';

const { SlashCommandBuilder, roleMention } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');
const gModel = require('../models/guildSchema.js');
const uModel = require('../models/userSchema.js');

const command = new SlashCommandBuilder()
.setName('levelrewards')
.setDescription('Manage Level Rewards in this server')
.addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Add a level reward')
    .addIntegerOption(option => option
        .setName('level')
        .setDescription('The level this reward is added. (Overwrites previously saved reward)')
        .setRequired(true)
  )
  .addRoleOption(option => option
    .setName('role')
    .setDescription('The role to reward')
    .setRequired(true)
  )
)
.addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a level reward')
    .addIntegerOption(option => option
        .setName('level')
        .setDescription('The level the reward is granted')
        .setRequired(true)
  )
)
.addSubcommand(subcommand => subcommand
    .setName('reset')
    .setDescription('Reset the level rewards for this server.')
)
.addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View all the level rewards for this server.')
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const subcommand = interaction.options.getSubcommand();
        const level      = interaction.options.getInteger('level');
        const role       = interaction.options.getRole('role');

        if ((subcommand !== 'view') && !interaction.member.permissions.has('MANAGE_GUILD')){
            return interaction.reply({
                ephemeral: true,
                content: '❌ You are not allowed to use this command!'
            });
        };

        let gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error){
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${gDocument.message}`
            });
        };
        const selfCanManageRoles = interaction.guild.me.permissions.has('MANAGE_ROLES');
        const msg = !selfCanManageRoles ? '\n⚠ The feature may not work as intended as i have no permissions to **Manage Roles**.' : ''
        if (subcommand === 'add'){
            if (!gDocument.roles.rewards.some(x => x.level === level)){
                gDocument.roles.rewards.push({ level, role });
            };
            const index = gDocument.roles.rewards.findIndex(x => x.level === level);
            gDocument.roles.rewards.splice(index, 1, { level, role: role.id });
            gDocument.roles.rewards.sort((A, B) => A.level - B.level);
            return gDocument.save().then(() => interaction.reply({
                ephemeral: true,
                content: `Successfully set ${role} as a reward for reaching level **${level}**!${msg}`
            }))
            .catch(error => interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${error.message}`
            }));
        };

        if (subcommand === 'remove'){
            if (!gDocument.roles.rewards.some(x => x.level ===level )){
                return interaction.reply({
                    ephemeral: true,
                    content: `Invalid Level: Level **${level}** has not been assigned a role reward!`
                });
            };
            const index = gDocument.roles.rewards.findIndex(x => x.level === level);
            const [ removed ] = gDocument.roles.rewards.splice(index, 1);
            return gDocument.save().then(() => interaction.reply({
                ephemeral: true,
                content: `Successfully removed ${roleMention(removed.role)} as a reward for reaching level **${level}**!${msg}`
            }))
            .catch(error => interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${error.message}`
            }));
        };

        if (subcommand === 'reset'){
            gDocument.roles.rewards = [];
            return gDocument.save().then(() => interaction.reply({
                ephemeral: true,
                content: `Successfully removed all the rewards!`
            }))
            .catch(error => interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${error.message}`
            }));
        };

        if (subcommand === 'view'){
            if (!gDocument.roles.rewards.length){
                return interaction.reply({
                    content: 'There are currently no assigned level rewards for this server.'
                });
            };
            const uDocument = await uModel.findByIdOrCreate(interaction.user.id);
            if (uDocument instanceof Error){
                return interaction.reply({
                    ephemeral: true,
                    content: `❌ Error: ${uDocument.message}`
                });
            };
            const embed = new MessageEmbed()
            .setColor([255,247,125])
            .setAuthor({ name: `${interaction.guild.name}'s role rewards`})
            .setFooter({ text: `Percent progress is based on ${interaction.user.tag}'s engagement on this server.`})
            .addFields(gDocument.roles.rewards.map(x => {
                const requiredXP = uDocument.getXPCap(interaction.guildId, x.level);
                const currentXP = uDocument.getXP(interaction.guildId).xp;
                const progress = currentXP * 100 / requiredXP;
                return {
                    name: `\u200b\u2000\u2000Level ${x.level}`,
                    value: [
                        `**Reward:** ${interaction.guild.roles.resolve(x.role)}`,
                        `**Progress:** ${(progress > 100 ? 100 : progress).toFixed(2)} %`
                    ].join('\n')
                }
            }));

            if (!selfCanManageRoles) embed.setDescription(msg);
            return interaction.reply({ embeds: [ embed ] });
        };
    }
};
