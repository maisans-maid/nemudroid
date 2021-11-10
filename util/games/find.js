'use strict';

const { MessageActionRow, MessageButton, MessageEmbed, Collection } = require('discord.js');
const model = require('../../models/userSchema.js');
const _ = require('lodash');
const moment = require('moment');

module.exports = async (interaction) => {

    const gameCache = interaction.client.localCache.games
            .get('find') ||
        interaction.client.localCache.games
        .set('find', new Collection())
        .get('find');

    const timestamp = gameCache.get(interaction.user.id);

    if (timestamp + 144e5 > Date.now())
        return interaction.reply({
          ephemeral: true,
          content: `You recently used this method. You can use this method again ${moment(timestamp + 144e5).fromNow()}.`
        });


    const locations = {
        'Carrot Fields': {
            value: _.random(40, 80),
            responses: [
                'Carrot fields really are some sort of a goldmine don\'t you think?',
                'I heard carrots that grow on these parts emit a special type of aura',
                'Should you be really taking something you found on another\'s property?'
            ]
        },
        'Fish Pond': {
            value: _.random(30, 60),
            responses: [
                'The owners of that pond must be rich~',
                'Should you be really taking something you found on another\'s property?',
            ]
        },
        'Airport': {
            value: _.random(30, 60),
            responses: [
                'The airport security is now suspicious of you.'
            ]
        },
        'School Grounds':{
            value: _.random(20, 40),
            responses: [
                'Shouldn\'t you return that to the student that lost it?'
            ]
        },
        'Optimum Truck':{
            value: _.random(15,30),
            responses: [
                'This meme didn\'t age well. And you fell for it!',
                'Where\'s the pride? I don\'t know either.'
            ]
        },
        'Vkrazzy\'s Treasure Trove':{
            value: _.random(15,30),
            responses: [
                'There\'s a handful of treasure but it is heavily guarded by a certain usagi so you only got that amount.',
                'Vkrazzy security team is now suspicious of you!'
            ]
        },
        'Stadium': {
            value: _.random(10,20),
            responses: [
                'And why did you think finding something in a stadium is a good idea?'
            ]
        },
        'Roadside': {
            value: _.random(1,10),
            responses: [
                'Nice.',
                'I didn\'t know why you decided to search on the roadside but, congratulations! At least you found something!'
            ]
        }
    };

    const row = new MessageActionRow().addComponents(
        _.shuffle(Object.entries(locations))
            .splice(0, 3)
            .map(([k, v]) => new MessageButton()
                .setLabel(k)
                .setCustomId(k)
                .setStyle('PRIMARY')
        )
    )

    const message = await interaction.reply({
        components: [ row ],
        content: 'Please select a location to search...',
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
                content: 'I wasn\'t asking for you!'
            });

            collector.stop('PROCESSED');
            const location = locations[i.customId];

            const profile = await model
                .findById(interaction.user.id)
                .catch(e => e) ||
                new model({ _id : interaction.user.id });

            if (profile instanceof Error){
                return i.reply({
                    ephemeral: true,
                    content: `:x: Error ${profile.message}`
                });
            };

            profile.credits += location.value;

            return profile
            .save()
            .then(() => i.update({
                content: `🔍 You found <a:coin:907310108550266970> **${location.value}** credits. ${location.responses[_.random(0, location.responses.length - 1)]}`,
                components: []
            }))
            .catch(e => i.update({
                content: `❌ Error: ${e.message}`
            }));

            return ;
    })
    .on('end', (x,r) => {
        if (r !== 'PROCESSED')
            message.edit({
                content: 'Didn\'t know what took you so long! But the credits were already found by somebody else!',
                components: []
            });

        gameCache.set(interaction.user.id, Date.now());
    });

};
