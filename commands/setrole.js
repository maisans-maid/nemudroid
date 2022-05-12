'use strict';


const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { guildSchemaPartial } = require('../utility/Typedefs.js');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('setrole')
.setDescription('Sets the various channel configurations for this server.')
.addSubcommandGroup(subcommandgroup => subcommandgroup
    .setName('set')
    .setDescription('Set a role for a specific function')
    .addSubcommand(subcommand => subcommand
        .setName('verify')
        .setDescription('Set a role for verification')
        .addRoleOption(option => option
            .setName('role')
            .setDescription('The role to use. Leave blank to remove role.')
        )
    )
)
.addSubcommandGroup(subcommandgroup => subcommandgroup
    .setName('picker')
    .setDescription('Edit the role-picker components')
    .addSubcommand(subcommand => subcommand
        .setName('category-add')
        .setDescription('Add a category for the role picker')
        .addStringOption(option => option
            .setName('category')
            .setDescription('The name of the category')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('limit')
            .setDescription('The limit of the role that can be added per category')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('image-url')
            .setDescription('The url of the image to use in the category')
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('category-remove')
        .setDescription('Remove a category from the role picker')
        .addStringOption(option => option
            .setName('category')
            .setDescription('The name of the category')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('category-add-role')
        .setDescription('Add role(s) to the selected category')
        .addStringOption(option => option
            .setName('category')
            .setDescription('The name of the category to add the roles to')
            .setRequired(true)
        )
        .addRoleOption(role => role
            .setName('role')
            .setDescription('The role to add as a selection in this category')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('label')
            .setDescription('The label for this role')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('style')
            .setDescription('The for this button')
            .addChoices([
                ['Blurple' ,'PRIMARY'],
                ['Gray', 'SECONDARY'],
                ['Green', 'SUCCESS'],
                ['Red', 'DANGER']
            ])
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('category-remove-role')
        .setDescription('Remove role(s) from the selected category')
        .addStringOption(option => option
            .setName('category')
            .setDescription('The name of the category to remove the roles from')
            .setRequired(true)
        )
        .addRoleOption(role => role
            .setName('role')
            .setDescription('The role to remove as a selection in this category')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('view-config')
        .setDescription('Display current config of the role picker')
    )
);
module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const role = interaction.options.getRole('role');

        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error)  return interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${gDocument.message})`
        });

        let response;
        if (subcommandGroup === 'set'){
            if (subcommand === 'verify'){
                gDocument.roles.verification = role ? role.id : null;
                client.custom.cache.guildSchemaPartials.set(interaction.guildId, new guildSchemaPartial(interaction.guild, gDocument));
                if (gDocument.roles.verification === null){
                    response = '✅ Successfully disabled role verification'
                } else {
                    response = `✅ Successfully set role ${role} as verification role`
                };
            };
        };

        if (subcommandGroup === 'picker'){
            if (subcommand === 'category-add'){
                const category = interaction.options.getString('category');
                const limit = interaction.options.getInteger('limit');
                const image = interaction.options.getString('image-url') || null;

                if ((limit < 1 || (limit > 10))) return interaction.reply({
                    ephemeral: true,
                    content: '❌ Invalid limit (Valid numbers range from 1-10)'
                });

                if (image && !/^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png|bmp)$/i.test(image)) return interaction.reply({
                    ephemeral: true,
                    content: '❌ Invalid image url'
                });

                const index = gDocument.roles.picker.findIndex(picker => picker.category.toUpperCase() === category.toUpperCase());
                if (index >= 0) return interaction.reply({
                    ephemeral: true,
                    content: '❌ Category of the same name already exist.'
                });
                gDocument.roles.picker.push({ category, limit, image, children: []});
                response = `Category **${category}** has been added!`
            };

            if (subcommand === 'category-remove'){
                const category = interaction.options.getString('category');
                const index = gDocument.roles.picker.findIndex(picker => picker.category.toUpperCase() === category.toUpperCase());
                if (index < 0) return interaction.reply({
                    ephemeral: true,
                    content: `❌ Role picker category with name "${category}" does not exist in the database. Valid categories are: ${ new Intl.ListFormat('en-us').format(gDocument.roles.picker.map(p => p.category)) || '*none*'}`
                });
                gDocument.roles.picker.splice(index, 1);
                response = `Category **${category}** has been removed!`
            };

            if (subcommand === 'category-add-role'){
                const category = interaction.options.getString('category');
                const label = interaction.options.getString('label');
                const style = interaction.options.getString('style');
                const index = gDocument.roles.picker.findIndex(picker => picker.category.toUpperCase() === category.toUpperCase());
                if (index < 0) return interaction.reply({
                    ephemeral: true,
                    content: `❌ Role picker category with name "${category}" does not exist in the database. Valid categories are: ${ new Intl.ListFormat('en-us').format(gDocument.roles.picker.map(p => p.category)) || '*none*'}`
                });
                const [subdoc] = gDocument.roles.picker.splice(index, 1);
                if (subdoc.children.length == 10) return interaction.reply({
                    ephemeral: true,
                    content: `❌ Maximum number of role on category *${category}* reached!`
                });
                subdoc.children.push({ id: role.id, label, style });
                gDocument.roles.picker.splice(index, 0, subdoc);
                response = `Role ${role} has been successfully added to category ${category}`;
            };

            if (subcommand === 'category-remove-role'){
                const category = interaction.options.getString('category');
                const index = gDocument.roles.picker.findIndex(picker => picker.category.toUpperCase() === category.toUpperCase());
                if (index < 0) return interaction.reply({
                    ephemeral: true,
                    content: `❌ Role picker category with name "${category}" does not exist in the database. Valid categories are: ${ new Intl.ListFormat('en-us').format(gDocument.roles.picker.map(p => p.category)) || '*none*'}`
                });
                const [subdoc] = gDocument.roles.picker.splice(index, 1);
                const subdocIndex = subdoc.children.findIndex(child => child.id === role.id);
                if (subdocIndex < 0) return interaction.reply({
                    ephemeral: true,
                    content: `❌ Role ${role} does not exist on "${category}". Valid roles are: ${ new Intl.ListFormat('en-us').format(subdoc.map(p => `<@${p.id}>`)) || '*none*'}`
                });
                subdoc.children.splice(subdocIndex, 1);
                gDocument.roles.picker.splice(index, 0, subdoc);
                response = `Role ${role} has been successfully removed from category ${category}`;
            };

            if (subcommand === 'view-config'){
                return interaction.reply({
                    ephemeral: true,
                    content: codeBlock(gDocument.roles.picker.map(picker => [
                        `-CATEGORY:${picker.category}`,
                        `      -LIMIT:${picker.limit}`,
                        `      -IMAGE:${Boolean(picker.image)}`,
                        `      -SELECTABLE_ROLES:`,
                        picker.children.length ? picker.children.map(child => `          ${child.label}:${interaction.guild.roles.cache.get(child.id)?.name || '<Deleted Role>'}`).join('\n') : '          None'
                    ].join('\n') || 'No categories were found!').join('\n'))
                })
            };
        };

        return gDocument.save()
        .then(() => interaction.reply({
            content: response,
            ephemeral: true
        }))
        .catch(err => interaction.reply({
            content: `❌ Oops! Something went wrong (${err.message})`,
            ephemeral: true
        }));
    }
}
