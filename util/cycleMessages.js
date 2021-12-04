'use strict';

const { Collection } = require('discord.js');
const model = require('../models/guildSchema.js');

exports.cycleMessages = async function (client) {
    client.localCache.cycledMessages = new Collection();

    const documents = await model.find({});

    for (const document of documents){
        console.log(document.cycledMessages)
        client.localCache.cycledMessages.set(document._id, new Collection());
        for (const message of document.cycledMessages){
            const interval = setInterval(function(){
                const guild = client.guilds.cache.get(document._id);
                const channel = guild.channels.cache.get(message.channelId);

                if (!channel){
                    return guild.channels.cache.get('907014736544145420').send({
                        embeds: [
                            new MessageEmbed()
                            .setColor('RED')
                            .setAuthor('⚠ MessageCycle Error')
                            .setDescription('Channel with Id ' + message.channelId + ' could not be found!')
                        ]
                    });
                };


                return channel
                .send({ content: message.content })
                .catch(error => guild.channels.cache.get('907014736544145420').send({
                    embeds: [
                        new MessageEmbed()
                        .setColor('RED')
                        .setAuthor('⚠ MessageCycle Error')
                        .setDescription(error.message)
                    ]
                }));
            }, message.duration * 36e5);
            client.localCache.cycledMessages.get(document._id).set(message.channelId, interval[Symbol.toPrimitive]())
        }
    };
};
