'use strict';
const gModel = require('../models/guildSchema.js');
const { Collection } = require('discord.js');

module.exports = async interaction => {

    await interaction.deferUpdate()

    const role = interaction.guild.roles.cache.get(interaction.customId.split(':')[1]);
    if (!role) return interaction.reply({
        ephemeral: true,
        content: '❌ The role for this selection no longer exist.'
    });

    const limit = Number(interaction.customId.split(':').pop());
    const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
    if (gDocument instanceof Error)  return interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${gDocument.message})`
    });

    if (interaction.member.roles.cache.has(role.id)) return interaction.member.roles.remove(role).catch(e => interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${e.message})`
    }));

    const category = gDocument.roles.picker.find(picker => picker.children.some(child => child.id === role.id));

    if (category){
        const roles = new Collection();
        for (const child of category.children){
            roles.set(child.id, interaction.guild.roles.cache.get(child.id));
        };
        const memberRoles = interaction.member.roles.cache;
        const obtainedRolesFromThisCategory = memberRoles.intersect(roles);
        while (obtainedRolesFromThisCategory.size >= category.limit){
            const key = obtainedRolesFromThisCategory.randomKey()
            obtainedRolesFromThisCategory.delete(key);
            memberRoles.delete(key);
        };
        return interaction.member.roles.set(memberRoles.set(role.id, role))
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `Oops! Something went wrong (${e.message})`
        }));
    } else {
        return interaction.member.roles.add(role)
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `Oops! Something went wrong (${e.message})`
        }));
    };
};
