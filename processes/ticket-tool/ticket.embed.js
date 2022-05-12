'use strict';

const { MessageEmbed } = require('discord.js');

module.exports = function generateEmbed(interaction, profile){
  return [
      new MessageEmbed()
      .setColor([255,247,125])
      .setAuthor({
          name: `${interaction.guild.name} Support`
      })
      .setDescription('If you wish to report something or need assistance, please open up a ticket below!')
      .setFooter({
          text: 'Don\'t create a ticket without reason or to troll or because you were curious what it does. You\'ll receive a warning.'
      })
      .addField(
          '__Only contact us through tickets for__',
          profile.text.supportReasons.map(x => `• ${x}`).join('\n') || 'Anything'
      ),

      new MessageEmbed()
      .setColor([255,247,125])
      .addField(
          '__After opening a ticket:__',
          [
            '• You will be redirected to a newly created channel just for you and the staff',
            '• Be patient for them to assist you while your situation is being handled',
            '• Be professional about your report'
          ].join('\n')
      )
      .addField(
          '\u200b',
          'Make sure what you\'re reporting is relevant to the list above.'
      )
      .setFooter({
          text: 'To open a ticket, click on the button below!'
      })
  ];
};
