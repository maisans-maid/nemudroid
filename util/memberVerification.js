'use strict';

const { Collection } = require('discord.js');
const model = require('../models/ruleSchema.js');


exports.memberVerification = async function (client) {
    client.localCache.memberVerifications = new Collection();

    const documents = await model.find({});
    for (const document of documents){
        client.localCache.memberVerifications.set(document._id, document);
    };

    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'VERIFY:MEMBER') return;

        const document = client.localCache.memberVerifications.get(interaction.guildId);

        if (!document.data.verify.role)
            return interaction.reply({
                ephemeral: true,
                content: '❌ Verify role has not been set on this server. Please inform the Moderators about this.'
            });

        if (!interaction.guild.roles.cache.has(document.data.verify.role))
            return interaction.reply({
                ephemeral: true,
                content: '❌ Verify role could not be found (may have been deleted or i could not get access to it). Please inform the Moderators about this.'
            });

        const role = interaction.guild.roles.cache.get(document.data.verify.role)

        if (role.rawPosition > interaction.guild.members.cache.get(client.user.id).roles.highest.rawPosition)
            return interaction.reply({
                ephemeral: true,
                content: '❌ Verify role could not be added. Reason: Verify Role position is higher than my highest role\'s position. Please inform the Moderators about this.'
            });

        if (!interaction.guild.members.cache.get(client.user.id).permissions.has(['MANAGE_ROLES']))
            return interaction.reply({
                ephemeral: true,
                content: '❌ I don\'t have the required permissions to add roles. Please contact the moderators and have them give me the \`Manage Roles\` permissions.'
            });

        if (interaction.member.roles.cache.has(role.id))
            return interaction.reply({
                ephemeral: true,
                content: '❌ You are already verified!'
            });

        return interaction.member.roles.add(role, 'NEMDROID: Verification purposes')
        .then(() => interaction.reply({
            ephemeral: true,
            content: '🎉 Congratulations! You have been successfully verified! You have gained access to most of the server\'s channels.'
        }))
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `❌ Unable to process your verification request: Reason: ${e.message}`
        }));
    });
};
