'use strict';

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const fetch = require('node-fetch');
const _ = require('lodash');

let flags = {};

module.exports = async interaction => {
    const userId = interaction.customId.split(':')[1];
    const action = interaction.customId.split(':')[2];

    if (userId !== interaction.user.id) return interaction.reply({
        ephemeral: true,
        content: '❌ You cannot control this interaction!'
    });

    if (!Object.keys(flags).length) flags = await fetch('https://raw.githubusercontent.com/hampusborgos/country-flags/main/countries.json').then(res => res.json()).catch(() => ({}));
    if (!Object.keys(flags).length){
        interaction.client.custom.cache.eventGame.delete(interaction.user.id);
        return interaction.update({
            content: `❌ Oops! Something went wrong (EXCEPTION:resource_not_found)`,
            components: [],
            embeds: []
        });
    };

    if (action == 'NEXT'){
        const countries = _.sampleSize(Object.entries(flags), 5);
        const [[code, country]] = _.sampleSize(countries, 1);
        const embed = new MessageEmbed()
            .setTitle('Guess the country from this flag!')
            .setColor('ORANGE')
            .setImage(`https://raw.githubusercontent.com/hampusborgos/country-flags/main/png1000px/${code.toLowerCase()}.png`)
        const buttons = [...countries, 'END'].map(x => new MessageButton()
            .setCustomId(typeof x === 'string' ? `EVENTGAME:${userId}:END` : `EVENTGAME:${userId}:ANSWERED:${x[0]}:${code}`)
            .setLabel(typeof x === 'string' ? 'End Game' : x[1])
            .setStyle(typeof x === 'string' ? 'DANGER' : 'PRIMARY')
        )
        const components = _.chunk(buttons, 5).map(x => new MessageActionRow().addComponents(...x));
        return interaction.update({
            embeds: [embed], components
        });
    };

    if (action === 'ANSWERED'){
        const answer = interaction.customId.split(':')[3];
        const correctAnswer = interaction.customId.split(':')[4];
        let description, color;
        if (answer !== correctAnswer){
            color = 'RED'
            description = `Oh no! Your answer, **${flags[answer]}**, is incorrect! The correct answer is **${flags[correctAnswer]}**!`
            interaction.client.custom.cache.eventGame.get(interaction.user.id).push(0);
        } else {
            color = 'GREEN'
            description = `Nice! You got it! The answer was **${flags[answer]}**`
            interaction.client.custom.cache.eventGame.get(interaction.user.id).push(1);
        };
        const embed = new MessageEmbed(interaction.message.embeds[0]).setDescription(description).setColor(color);
        const choices = interaction.message.components[0].components.map(x => new MessageButton(x).setDisabled(true));
        choices.find(x => x.customId.split(':')[3] === answer).setStyle('DANGER');
        choices.find(x => x.customId.split(':')[3] === correctAnswer).setStyle('SUCCESS');
        const otherButtons = ['Next', 'End'].map(x => new MessageButton().setCustomId(`EVENTGAME:${userId}:${x.toUpperCase()}`).setLabel(x).setStyle(x === 'Next' ? 'PRIMARY' : 'DANGER'));
        return interaction.update({
            embeds: [ embed ],
            components: _.chunk([...choices, ...otherButtons], 5).map(x => new MessageActionRow().addComponents(...x))
        });
    };

    if (action === 'END'){
        const playerScore = interaction.client.custom.cache.eventGame.get(interaction.user.id);
        const embed = new MessageEmbed()
        .setAuthor({ name: interaction.member.displayName })
        .setTitle('EVENT NAME: Guess the Country (Results)')
        .setColor('YELLOW')
        .setFooter({ text: 'Note that scores are not stored on the database (yet)' })
        .addFields({
            name: 'Total Attempts',
            value: playerScore.length.toString()
        },{
            name: 'Correct Attempts',
            value: playerScore.filter(x => Boolean(x)).length.toString()
        },{
            name: 'Incorrect Attempts',
            value: playerScore.filter(x => !Boolean(x)).length.toString()
        },{
            name: 'Win Percentage',
            value: (playerScore.filter(x => Boolean(x)).length * 100 / playerScore.length).toFixed(2) + ' %'
        });

        return interaction.update({
            content: 'Thank you for playing',
            embeds: [ embed ],
            components: []
        }).finally(() => interaction.client.custom.cache.eventGame.delete(interaction.user.id));
    };
};
