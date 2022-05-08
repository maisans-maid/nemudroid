'use strict';

const gModel = require('../models/guildSchema.js');

module.exports = async interaction => {

    const action = interaction.customId.split(':').pop();

    if (!interaction.member.permissions.has('MANAGE_GUILD')) return interaction.reply({
        ephemeral: true,
        content: 'You have no permission to configure these rules.'
    });

    const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);
    if (gDocument instanceof Error) return interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${gDocument.message})`
    });

    // 'fields' was called twice here because we did not use the interactionFieldResolver
    const title = interaction.fields.fields.get(`${action}:TOPIC`)?.value || null;
    const description = interaction.fields.fields.get(`${action}:DESCRIPTION`)?.value || null;
    const ruleNumber = Number(interaction.fields.fields.get(`${action}:RULE_NUMBER`)?.value) || null;
    let iconURL = interaction.fields.fields.get(`${action}:ICON_URL`)?.value || null;
    let order = interaction.fields.fields.get(`${action}:ORDER`)?.value || null;

    if (iconURL && !/^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png|bmp)$/i.test(iconURL)) iconURL = null;

    if (action === 'ADD'){
        gDocument.text.rules.push({ title, description, iconURL });
    };

    if (action === 'EDIT'){
        if (!gDocument.text.rules.length) return interaction.reply({
            ephemeral: true,
            content: '⚠ Nothing to edit.'
        });
        if (!ruleNumber || (ruleNumber < 1) || (ruleNumber > gDocument.text.rules.length)) return interaction.reply({
            ephemeral: true,
            content: `❌ Invalid number`
        });
        gDocument.text.rules.splice(ruleNumber - 1, 1, {
            title: title ? title : gDocument.text.rules[ruleNumber - 1].title,
            description: description ? description :  gDocument.text.rules[ruleNumber - 1].description,
            iconURL: iconURL ? iconURL :  gDocument.text.rules[ruleNumber - 1].iconURL
        });
    };

    if (action === 'REMOVE'){
        if (!gDocument.text.rules.length) return interaction.reply({
            ephemeral: true,
            content: '⚠ Nothing to remove.'
        });
        if (!ruleNumber || (ruleNumber < 1) || (ruleNumber > gDocument.text.rules.length)) return interaction.reply({
            ephemeral: true,
            content: `❌ Invalid number`
        });
        gDocument.text.rules.splice(ruleNumber - 1, 1);
    };

    if (action === 'REORDER'){
        if (!gDocument.text.rules.length) return interaction.reply({
            ephemeral: true,
            content: '⚠ Nothing to reorder.'
        });
        order = [...new Set(order.split('-').map(x => Number(x)))];
        if (order.some(x => !x ) || (Math.max(order) > gDocument.text.rules.length) || (Math.min(order) < 1)) return interaction.reply({
            ephemeral: true,
            content: '❌ Invalid format. Please follow the proper format'
        });
        const newOrder = [];
        gDocument.text.rules.forEach((rule, index) => {
            const newIndex = order[index] >= 0 ? order[index] : 10 + index;
            newOrder[newIndex] = rule;
        });
        gDocument.text.rules = newOrder;
    };

    return gDocument.save().then(() => interaction.reply({
        ephemeral: true,
        content: '✅ Successfully configured the rules!'
    }))
    .catch(e => interaction.reply({
        ephemeral: true,
        content: `❌ Oops! Something went wrong (${e.message})`
    }));
};
