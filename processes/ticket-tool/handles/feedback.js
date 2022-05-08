'use strict';

const { ModalBuilder, ModalField } = require('discord-modal');

module.exports = async function submitFeedback(interaction){
    const modal = new ModalBuilder()
        .setCustomId('SUBMIT_FEEDBACK')
        .setTitle('Submit feedback')
        .addComponents(
            new ModalField()
                .setLabel('Subject')
                .setStyle('short')
                .setPlaceholder('Topic of your feedback...')
                .setCustomId('subject')
                .setMax(256)
                .setRequired(true),
            new ModalField()
                .setLabel('Description')
                .setStyle('paragraph')
                .setPlaceholder('Brief explanation of your feedback...')
                .setCustomId('description')
                .setMax(2000)
                .setRequired(true)
        )

     interaction.client.modal.open(interaction, modal)
};
