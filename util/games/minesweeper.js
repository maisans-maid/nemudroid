'use strict';

const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { checkDuplicateInstance, removeInstance } = require('./_Games.util.js');
const { basename } = require('path');
const model = require('../../models/userSchema.js');
const _ = require('lodash');
const GraphemeSplitter = require('grapheme-splitter');

module.exports = async function(interaction){

    const isNotDuplicate = await checkDuplicateInstance(
        interaction,
        basename(__filename, '.js')
    );

    if (!isNotDuplicate) return;

    const splitter = new GraphemeSplitter();

    const elements = _.shuffle([
        ...splitter.splitGraphemes('💥'.repeat(5)),
        ...splitter.splitGraphemes('1️⃣'.repeat(7)),
        ...splitter.splitGraphemes('2️⃣'.repeat(6)),
        ...splitter.splitGraphemes('3️⃣'.repeat(5)),
        ...splitter.splitGraphemes('4️⃣'.repeat(2)),
    ]);

    const embed = new MessageEmbed()
        .setAuthor('Minesweeper - Let\'s play Minesweeper!')
        .setDescription('Click on the buttons below while evading the bombs. Accumulated points before the bomb is clicked is the credits you will earn. There are 5 bombs in this minefield. You have a minute per turn before the game force-ends.')
        .setColor('GREEN');

    const components = _.chunk(elements, 5).map((chunk, parentIndex) => new MessageActionRow()
        .addComponents(
            chunk.map((element, childIndex) => new MessageButton()
                .setLabel('\u200b')
                .setCustomId((childIndex + (parentIndex * 5)).toString())
                .setStyle('SECONDARY')
                .setEmoji('907495598075306014')
            )
        )
    );

    let profile = await model
        .findById(interaction.user.id)
        .catch(e => e) ||
        new model({ _id : interaction.user.id });

    if (profile instanceof Error)
        return interaction.reply({
            ephemeral: true,
            content: `:x: Error ${profile.message}`
        });

    const message = await interaction.reply({
        components,
        embeds: [ embed ],
        fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 60000
    });

    let counter = 0;
    let currentComponentState = components;

    collector
    .on('collect', async i => {
        if (i.user.id !== interaction.user.id)
            return i.reply({
                ephemeral: true,
                content: 'This challenge is not for you!'
            });

        let revealedButton;

        const newComponents = message.components
            .map((row, parentIndex) => new MessageActionRow().addComponents(
                row.components.map((button, childIndex) => {
                    const id = parseInt(i.customId) + 1;
                    const clicked = {
                        parentIndex: Math.floor((parseInt(i.customId)) / 5),
                        get childIndex(){ return (id - this.parentIndex * 5) - 1 }
                    };

                    function isBtn(){
                        return clicked.parentIndex === parentIndex && clicked.childIndex === childIndex;
                    };

                    revealedButton = elements[i.customId];

                    return new MessageButton(button)
                    .setStyle(isBtn()
                        ? revealedButton === '💥'
                            ? 'DANGER'
                            : 'SUCCESS'
                        : button.style
                    )
                    .setEmoji(isBtn()
                        ? revealedButton
                        : button.emoji
                    )
                    .setDisabled(isBtn()
                        ? true
                        : button.disabled
                    );
                })
            )
        );

        currentComponentState = newComponents;

        if (revealedButton === '💥'){
          i.deferUpdate();
          return collector.stop();
        };

        const values = {
            '1️⃣': 1,
            '2️⃣': 2,
            '3️⃣': 3,
            '4️⃣': 4
        };

        counter += values[revealedButton];

        if (!embed.fields.length){
            embed.addField('Current Score', counter.toString());
        } else {
            embed.spliceFields(0,1,{
                name: 'Current Score',
                value: counter.toString()
            });
        };

        i.update({
            embeds: [ embed ],
            components: newComponents
        });
    })
    .on('end', async () => {
        embed.setColor('RED');
        const response = {
            content: `⚔️ This challenge has ended! You earned a total of <a:coin:907310108550266970> **${counter * 4}** credits!`,
            embeds: [ embed ],
            components: currentComponentState.map((row, parentIndex) => new MessageActionRow().addComponents(
                row.components.map((button, childIndex) => new MessageButton(button)
                      .setEmoji(elements[childIndex + (parentIndex * 5)])
                      .setDisabled(true)
                )
            ))
        };

        profile = await model
            .findById(interaction.user.id)
            .catch(e => e)

        if (profile instanceof Error)
            return interaction.editReply({
                ephemeral: true,
                content: `:x: Error ${profile.message}`
            });

        profile.credits += Math.ceil(counter * 2.25);
        profile.gamestats.minesweeper.games_played++;

        if (counter > profile.gamestats.minesweeper.high_score)
            profile.gamestats.minesweeper.high_score = counter;

        return profile
        .save()
        .then(() => message.edit(response))
        .catch(e => message.edit({ content: `Error: ${e.message}`}))
        .finally(() => removeInstance(interaction, basename(__filename, '.js')));
    });

    return;
};
