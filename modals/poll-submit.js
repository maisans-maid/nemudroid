'use strict';

const pModel = require('../models/pollSchema.js');
const PollEmbed = require('../processes/poll/poll.Embed.js');
const PollComponents = require('../processes/poll/poll.Components.js');

module.exports = async interaction => {

    if (interaction.customId.split(':').pop() === 'CREATE'){
        const pDocument = new pModel().from(interaction);
        for (let n = 1; n <= 4; n++){
            const topic = interaction.fields.getTextInputValue(`option-${n}`);
            if (topic) pDocument.addChoice(topic);
        };

        const embed = new PollEmbed(interaction.user, pDocument);
        const components = new PollComponents().generateComponentsFrom(pDocument);

        return interaction.reply({ embeds: [embed], components, fetchReply: true }).then(m => {
            pDocument.messageId = m.id;
            return pDocument.save();
        });
    };

    if (interaction.customId.split(':').pop() === 'ADD_2'){
        const pDocument = await pModel.findById(interaction.customId.split(':')[1]);
        pDocument.addChoice(interaction.fields.getTextInputValue('option'));

        const embed = new PollEmbed(interaction.user, pDocument);
        const components = new PollComponents().generateComponentsFrom(pDocument);
        const message = await interaction.channel.messages.fetch(pDocument.messageId).catch(e => e);

        return message.edit({
            embeds: [embed], components
        })
        .then(() => pDocument.save())
        .then(() => interaction.reply({
            ephemeral: true,
            content: 'Successfully updated the poll!'
        }))
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `Oops! An error has occured ${e.message}`
        }));
    };
};
