'use strict';

const { MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');

module.exports = class PollComponents extends Array {
    generateComponentsFrom(pDocument){
        const buttons = pDocument.options.sort((A,B) => A.id - B.id).map(option => new MessageButton()
            .setLabel(`${option.id}`)
            .setStyle('SECONDARY')
            .setCustomId(`POLL:${pDocument._id}:${option.id}`)
        );

        if (buttons.length < 10) buttons.push(new MessageButton()
            .setLabel('＋')
            .setStyle('PRIMARY')
            .setCustomId(`POLL:${pDocument._id}:ADD_1`)
        );

        const votationControls = _.chunk(buttons, 5).map(chunk => new MessageActionRow().addComponents(chunk));
        const authorControls = new MessageActionRow().addComponents([
          new MessageButton()
          .setLabel('▼ Move To Most Recent')
          .setStyle('PRIMARY')
          .setCustomId(`POLL:${pDocument._id}:RECENT`),
          new MessageButton()
          .setLabel('End Poll')
          .setEmoji('🔻')
          .setStyle('DANGER')
          .setCustomId(`POLL:${pDocument._id}:END`)
        ])

        this.push(...votationControls, authorControls)
        return this;
    };
};
