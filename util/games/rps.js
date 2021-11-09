'use strict';

const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const model = require('../../models/userSchema.js');
const _ = require('lodash');

module.exports = async function(interaction){
    const choices = [ `✊`, `🖐`, `✌️` ];
    const conditions = {
        '✊': {
            win: '✌️',
            lose: '🖐'
        },
        '🖐': {
            win : '✊',
            lose: '✌️'
        },
        '✌️': {
            win: '🖐',
            lose: '✊'
        }
    };
    const won = () => [true, false][_.random(0,1)];

    const row = new MessageActionRow().addComponents(
        [...choices, '❌'].map(c => new MessageButton()
            .setLabel(c)
            .setCustomId(c)
            .setStyle(choices.includes(c) ? 'SECONDARY' : 'DANGER')
        )
    );

    const embed = new MessageEmbed()
        .setAuthor('RPS - Let\'s play Janken!')
        .setDescription('Select from the buttons below your pick, and i will compete with you. Each action costs **5** credits. However, winning the game will give you **5 credits** instead (action cost excluded).')
        .setColor('GREEN');

    const message = await interaction.reply({
        components: [ row ],
        embeds: [ embed ],
        fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 30000
    });

    collector
    .on('collect', async i => {
        if (i.user.id !== interaction.user.id)
            return i.reply({
                ephemeral: true,
                content: 'This challenge is not for you!'
            });

        if (i.customId === '❌'){
            i.deferUpdate();
            return collector.stop();
        };

        const profile = await model
            .findById(interaction.user.id)
            .catch(e => e) ||
            new model({ _id : interaction.user.id });

        if (profile instanceof Error){
            collector.stop();
            return i.reply({
                ephemeral: true,
                content: `:x: Error ${profile.message}`
            });
        };

        if (profile.credits < 5){
            collector.stop();
            return i.reply({
                ephemeral: true,
                content: ':x: You do not have enough credits to keep playing :('
            });
        };

        const hasWon = won();

        profile.credits -= 5;

        if (hasWon)
            profile.credits += 10;

        const userpick = i.customId
        const botpick = conditions[userpick][hasWon ? 'win' : 'lose'];

        if (embed.fields.length){
            embed.spliceFields(0 ,1, {
                name: '<a:coin:907310108550266970> Current Balance',
                value: profile.credits.toLocaleString('en-US', { maximumFractionDigits: 0 })
            })
        } else {
            embed.addField('<a:coin:907310108550266970> Current Balance', profile.credits.toLocaleString('en-US', { maximumFractionDigits: 0 }));
        };

        return profile
        .save()
        .then(() => {
            collector.resetTimer({
                time: 30000
            });

            return i.update({
                content: `> ${i.user.tag} ${userpick} vs ${botpick} ${interaction.client.user.tag}\n${hasWon ? ':tada:' : ':x:'} **${i.user.tag}** ${hasWon ? 'Won' : 'Lost'} the previous game (<a:coin:907310108550266970> ${hasWon ? '**+5** to' : '**-5** from'} credits)`,
                embeds: [ embed.setFooter('Click on the button below to play again') ],
                components: [ row ]
            });
        })
        .catch(e => {
            collector.stop();
            return i.reply({
                ephemeral: true,
                content: `:x: Error: ${e.message}`
            });
        });
    })
    .on('end', collected => {
      const response = {
          content: '⚔️ This challenge has ended!',
          embeds: [ embed.setFooter('').setColor('RED') ],
          components: [
              new MessageActionRow().addComponents(
                  row.components.map(button => new MessageButton(button)
                      .setDisabled(true)
                  )
              )
          ]
      };
      return message.edit(response);
    });

    return;
};