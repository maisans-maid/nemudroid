const { SlashCommandBuilder, hideLinkEmbed } = require('@discordjs/builders');
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const model = require('../models/ruleSchema.js');

const command = new SlashCommandBuilder()
.setName('verify')
.setDescription('Setup verification system')
.addSubcommand(subcommand => subcommand
    .setName('push')
    .setDescription('Pushes the currently saved verification configuration to a channel')
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Push to this channel')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('preview')
    .setDescription('Displays a preview of the rules UI')
)
.addSubcommand(subcommand => subcommand
    .setName('editrule')
    .setDescription('Edits a specific rule (title and/or description)')
    .addIntegerOption(option => option
        .setName('rule-number')
        .setDescription('The rule to edit')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('rule-title')
        .setDescription('The title of this rule.')
    )
    .addStringOption(option => option
        .setName('rule-description')
        .setDescription('The description of the rule.')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('edit-verify-button')
    .setDescription('Edits the verify button')
    .addStringOption(option => option
        .setName('button-label')
        .setDescription('The label of the button')
    )
    .addStringOption(option => option
        .setName('button-style')
        .setDescription('The style of the button')
        .addChoices([
            [ 'Blurple', 'PRIMARY' ],
            [ 'Semi-transparent', 'SECONDARY' ],
            [ 'Green', 'SUCCESS' ],
            [ 'Red', 'DANGER' ],
        ])
    )
    .addStringOption(option => option
        .setName('button-emoji')
        .setDescription('The emoji of the button')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('assign-role')
    .setDescription('Assigns/Deassigns a verified role')
    .addRoleOption(option => option
        .setName('role')
        .setDescription('The role to assign (leave blank to deassign)')
    )
)
.addSubcommand(subcommand => subcommand
    .setName('reset')
    .setDescription('Resets the current configuration to default.')
)

const allowedPermissions = (Guild) => Guild.roles.cache
    .filter(role => role.permissions.has('MANAGE_GUILD'))
    .map(role => Object.assign({},{
        id: role.id,
        type: 'ROLE',
        permission: true
    }));

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });

        const document = await model.findById(interaction.guildId) || new model({ _id: interaction.guildId });

        if (document instanceof Error){
            return interaction.editReply({
                content: '❌ Error: ' + document.message
            });
        };

        saveToClient(interaction, document);

        if (subcommand === 'push'){
            const channel = interaction.options.getChannel('channel');

            if (typeof channel.send !== 'function')
                return interaction.editReply({
                    content: '❌ Invalid Channel: Channel must be a text-based channel.'
                });

            return channel.send({
                content: document.data.content,
                embeds: document.data.embeds.map(x => new MessageEmbed(x).setColor([255,247,125])),
                components: [ new MessageActionRow().addComponents( new MessageButton(document.data.verify.button))]
            })
            .then(() => interaction.editReply({
                content: 'Successfully implemented the verification system to this channel. Please delete previous verification UI as it may cause unexpected behaviors, if there is any.'
            }))
            .catch(error => interaction.editReply({
                content: `❌ Error ${error.message}`
            }));
        };

        if (subcommand === 'preview'){
            return interaction.editReply({
                content: document.data.content,
                embeds: document.data.embeds.map(x => new MessageEmbed(x).setColor([255,247,125])),
                components: [ new MessageActionRow().addComponents( new MessageButton(document.data.verify.button).setDisabled(true))]
            });
        };

        if (subcommand === 'editrule'){
            const ruleNumber = interaction.options.getInteger('rule-number');
            const ruleTitle = interaction.options.getString('rule-title');
            const ruleDescription = interaction.options.getString('rule-description');

            if (ruleNumber < 1){
                return interaction.editReply({
                    content: '❌ Rule number must be between 1 and 10'
                });
            };

            if (ruleNumber > 10){
                return interaction.editReply({
                    content: '❌ Current implementation only supports up to 10 rule categories.'
                });
            };

            if (!ruleTitle && !ruleDescription)
                return interaction.editReply({
                    content: '❌ You must supply at least the title or description for this rule.'
                });

            document.data.embeds.splice(ruleNumber - 1, 1, {
                author: { name: ruleTitle || document.data.embeds[ruleNumber - 1].author.name },
                description: ruleDescription || document.data.embeds[ruleNumber - 1].description
            });

            document.save()
            .then(() => {
                saveToClient(interaction, document)
                return interaction.editReply({
                    content: 'Successfully saved the configuration!'
                });
            })
            .catch(e => interaction.editReply({
                content: `❌ Error: ${e.message}`
            }));
        };

        if (subcommand === 'edit-verify-button'){
          const buttonLabel = interaction.options.getString('button-label');
          const buttonStyle = interaction.options.getString('button-style');
          const buttonEmoji = interaction.options.getString('button-emoji');

          if (!buttonLabel && !buttonStyle && !buttonEmoji)
              return interaction.editReply({
                  content: '❌ You must supply at least the label, style, or emoji for this verify button.'
              });

          document.data.verify.button.label = buttonLabel || document.data.verify.button.label;
          document.data.verify.button.style = buttonStyle || document.data.verify.button.style;
          document.data.verify.button.emoji = buttonEmoji || document.data.verify.button.emoji;

          return document.save()
          .then(() => {
              saveToClient(interaction, document);
              return interaction.editReply({
                  content: 'Successfully saved the configuration!'
              })
          })
          .catch(e => interaction.editReply({
              content: `❌ Error: ${e.message}`
          }));
        };

        if (subcommand === 'assign-role'){
            const role = interaction.options.getRole('role') || { id: null };
            document.data.verify.role = role.id;
            return document.save()
            .then(() => {
                saveToClient(interaction, document)
                return interaction.editReply({
                    content: `The verified role was successfully ${role.id ? `set to ${role}` : 'removed'}.`
                })
            })
            .catch(e => interaction.editReply({
                content: `❌ Error: ${e.message}`
            }));
        };

        if (subcommand === 'reset'){
            document.data = new model().toJSON().data;
            return document.save()
            .then(() => {
                saveToClient(interaction, document)
                return interaction.editReply({
                    content: 'The configuration was reset.'
                });
            })
            .catch(e => interaction.editReply({
                content: `❌ Error: ${e.message}`
            }));
        };
    }
};

function saveToClient(interaction, document){
    return interaction.client.localCache.memberVerifications.set(interaction.guildId, document.toJSON());
};
