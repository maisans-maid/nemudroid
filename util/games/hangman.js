'use strict';

const { codeBlock } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const topics = require('../../assets/json/hangman-anime-topics.json');
const model = require('../../models/userSchema.js');
const _ = require('lodash');

const hangs = [
   '/---|\n|\n|\n|\n|',
   '/---|\n|   o\n|\n|\n|',
   '/---|\n|   o\n|   |\n|\n|',
   '/---|\n|   o\n|  /|\n|\n|',
   '/---|\n|   o\n|  /|\\\n|\n|',
   '/---|\n|   o\n|  /|\\\n|  /\n|',
   '/---|\n|   o ~ GAME OVER!\n|  /|\\\n|  / \\\n|'
];

module.exports = async function(interaction){


    //--------------game start------------------//
    const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const topic = topics[_.random(0, topics.length - 1)].toUpperCase();
    const correctLetters = [...new Set(topic)].filter(c => alphanumeric.includes(c));
    const randomLetters = _.shuffle(alphanumeric)
        .filter(c => !correctLetters.includes(c))
        .splice(0, 25 - correctLetters.length);
    const displayLetters = _.shuffle([
        ...correctLetters,
        ...randomLetters
    ]);

    let currentState = topic.replace(/\w/g,'_');
    let tries_remaining = 6;
    let victory = false;

    const embed = new MessageEmbed()
    .setColor('ORANGE')
    .addField(
        'Guess the Anime!',
        codeBlock([...hangs].reverse()[tries_remaining]),
        true
    )
    .addField(
        'Tries Remaining',
        '<:nemu_chibi:900751718399213628>'.repeat(tries_remaining) || '\u200b',
        true
    )
    .addField(
        'Answer Field',
        codeBlock(currentState.split('').join(' '))
    );

    let components = _.chunk(displayLetters, 5)
        .map(chunk => new MessageActionRow().addComponents(
              chunk.map(letter => new MessageButton()
                  .setLabel(letter)
                  .setCustomId(letter)
                  .setStyle('SECONDARY')
              )
        ));

    const message = await interaction.reply({
        components,
        embeds: [ embed ],
        fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 60000
    });

    collector
    .on('collect', async i => {
        if (i.user.id !== interaction.user.id)
            return i.reply({
                ephemeral: true,
                content: 'This challenge is not for you!'
            });

        components = components
            .map(row => new MessageActionRow().addComponents(
                row.components.map(button => new MessageButton(button)
                    .setStyle(button.customId === i.customId
                          ? topic.includes(i.customId)
                              ? 'SUCCESS'
                              : 'DANGER'
                          : button.style
                    )
                    .setDisabled(button.customId === i.customId
                          ? true
                          : button.disabled
                    )
                    .setLabel(button.label)
                )
            ));

        if (topic.includes(i.customId)){
            topic.split('')
            .forEach((letter, index) => {
                if (letter === i.customId){
                    const splitted = currentState.split('');
                    splitted[index] = i.customId;
                    currentState = splitted.join('');
                };
            });
        } else {
            tries_remaining --;
        };

        embed.spliceFields(0, 3, [
            {
                name: embed.fields[0].name,
                value: codeBlock([...hangs].reverse()[tries_remaining]),
                inline: embed.fields[0].inline
            },
            {
                name: embed.fields[1].name,
                value: '<:nemu_chibi:900751718399213628>'.repeat(tries_remaining) || '\u200b',
                inline: embed.fields[1].inline
            },
            {
                name: embed.fields[2].name,
                value: codeBlock(currentState.split('').join(' '))
            }
        ]);

        if (tries_remaining === 0){
            i.deferUpdate();
            return collector.stop('NO_MORE_TRIES');
        };

        if (!currentState.includes('_')){
            i.deferUpdate();
            victory = true;
            return collector.stop('COMPLETED');
        };

        collector.resetTimer({
            time: 60000
        });

        i.update({
            embeds: [ embed ],
            components
        })
    })
    .on('end', async (_, reason) => {

      const reasons = {
          NO_MORE_TRIES: '❌ You have no tries left!',
          COMPLETED: '🎉 You completed the puzzle!'
      };

      const profile = await model
          .findById(interaction.user.id)
          .catch(e => e)

      if (profile instanceof Error)
          return interaction.followUp({
              ephemeral: true,
              content: `❌ Error ${profile.message}`
          });

      let extra = '';

      if (!victory){
          profile.gamestats.hangman.games_lost++;
          embed.addField(
              'Correct Answer',
              codeBlock(topic.split('').join(' '))
          );
      } else {
        const credits = Math.ceil(topic.length * 1.25);
        const bonus = Math.ceil(credits * (tries_remaining * 0.15))

        profile.credits += Math.ceil(credits + bonus);
        profile.gamestats.hangman.games_won++;

        extra += `You got <a:coin:907310108550266970> **${credits}** credits as a reward. (+ <a:coin:907310108550266970> **${bonus}** credits as a bonus for your unused attempts!)`
      };

      profile
      .save()
      .then(() => message.edit({
          content: `⚔️ This challenge has ended! (${reasons[reason] || '⏳ You ran out of time!'})\n${extra}`,
          components: components.map(row => new MessageActionRow().addComponents(
              row.components.map(button => new MessageButton(button).setDisabled(true))
          )),
          embeds: [ embed.setColor(victory ? 'GREEN' : 'RED') ]
      }))
      .catch(e => interaction.followUp({
          ephemeral: true,
          content: `❌ Error: ${e.message}`
      }))
    })
};
