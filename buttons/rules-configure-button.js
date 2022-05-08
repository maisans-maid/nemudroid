'use strict';

const { ModalBuilder, ModalField } = require('discord-modal');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const gModel = require('../models/guildSchema.js');

module.exports = async interaction => {

    if (!interaction.member.permissions.has('MANAGE_GUILD')) return interaction.reply({
        ephemeral: true,
        content: `❌ You have no permission to configure the rules`
    });

    /**
     * Action may be one of the following as permitted in utility/Rules.components.config.js file
     * * ADD
     * * EDIT
     * * REMOVE
     * * REORDER
     * @type {String}
    */
    const action = interaction.customId.split(':').pop();
    const modal = new ModalBuilder()
        .setCustomId(`RULES_MODAL:${action}`)
        .setTitle(`${action.charAt(0) + action.slice(1).toLowerCase()} Rule(s)`)

    if (action === 'ADD'){
        modal.addComponents(
            new ModalField()
                .setLabel('Rule Topic')
                .setStyle('short')
                .setPlaceholder('Topic for this rule')
                .setCustomId('ADD:TOPIC')
                .setMax(256)
                .setRequired(true),
            new ModalField()
                .setLabel('Rule Description')
                .setStyle('paragraph')
                .setPlaceholder('Description of this rule')
                .setCustomId('ADD:DESCRIPTION')
                .setMax(1000)
                .setRequired(true),
            new ModalField()
                .setLabel('Rule Icon')
                .setStyle('short')
                .setPlaceholder('A 1:1 icon url for this rule')
                .setCustomId('ADD:ICON_URL')
                .setMax(1000)
                .setRequired(false)
        );
    };

    if (action === 'EDIT'){
        modal.addComponents(
            new ModalField()
                .setLabel('Rule Number')
                .setStyle('short')
                .setPlaceholder('The order of the rule to edit as displayed in the message')
                .setCustomId('EDIT:RULE_NUMBER')
                .setMax(2)
                .setRequired(true),
            new ModalField()
                .setLabel('Rule Topic')
                .setStyle('short')
                .setPlaceholder('New topic for this rule')
                .setCustomId('EDIT:TOPIC')
                .setMax(256)
                .setRequired(false),
            new ModalField()
                .setLabel('Rule Description')
                .setStyle('paragraph')
                .setPlaceholder('New description of this rule')
                .setCustomId('EDIT:DESCRIPTION')
                .setMax(1000)
                .setRequired(false),
            new ModalField()
                .setLabel('Rule Icon')
                .setStyle('short')
                .setPlaceholder('A 1:1 icon url for this rule')
                .setCustomId('EDIT:ICON_URL')
                .setMax(1000)
                .setRequired(false)
        );
    };

    if (action === 'REMOVE'){
        modal.addComponents(
            new ModalField()
                .setLabel('Rule Number')
                .setStyle('short')
                .setPlaceholder('The order of the rule to remove as displayed in the message')
                .setCustomId('REMOVE:RULE_NUMBER')
                .setMax(2)
                .setRequired(true)
        );
    };

    if (action === 'REORDER'){
        modal.addComponents(
            new ModalField()
                .setLabel('New Role Order')
                .setStyle('short')
                .setPlaceholder('format (#-#-#-#-#) e.g. (1-5-3-2-4) without parenthesis')
                .setCustomId('REORDER:ORDER')
                .setMax(19)
                .setRequired(true)
        );
    };

    if (action === 'REFRESH'){
        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
        if (gDocument instanceof Error) return interaction.reply({
            ephemeral: true,
            content: `❌ Oops! Something went wrong (${gDocument.message})`
        });
        const channel = interaction.guild.channels.cache.get(gDocument.channels.verification);
        if (!channel) return interaction.followUp({
            ephemeral: true,
            content: '⚠ Verification channel was not found. Rule Message Edit failed!'
        });
        const messages = await channel.messages.fetch();
        const message = messages.filter(x => x.author.id === interaction.client.user.id).first();
        const embeds = gDocument.text.rules.map(rule => new MessageEmbed()
            .setColor([255,247,125])
            .setTitle(rule.title)
            .setDescription(rule.description)
            .setThumbnail(rule.iconURL)
        );
        const components = [ new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('VERIFY:USER')
                .setLabel('I have read and understood these rules! Verify me!')
                .setStyle('SUCCESS')
        )];
        if (message) return message.edit({ embeds, components })
            .then(() => interaction.deferUpdate())
            .catch(e => interaction.reply({
                ephemeral: true,
                content: `❌ Oops! Something wrong has happened (${e.message})`
            }));

        return channel.send({ embeds, components })
            .then(() => interaction.deferUpdate())
            .catch(e => interaction.reply({
                ephemeral: true,
                content: `❌ Oops! Something wrong has happened (${e.message})`
            }));
    };

    return interaction.client.modal.open(interaction, modal);
};
