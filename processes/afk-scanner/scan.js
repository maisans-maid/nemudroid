'use strict';

const { Collection } = require('discord.js');
const gModel = require('../../models/guildSchema.js');

module.exports = async message => {
    let afks = message.client.custom.cache.afkUsers.get(message.guild.id);
    if (!afks) afks = message.client.custom.cache.afkUsers.set(message.guild.id, new Collection()).get(message.guild.id);
    if (!afks.size) return;

    const messages = [];

    for (const [id, displayText] of afks){
        if (message.mentions.members.has(id)){
            messages.push(`**${message.mentions.members.get(id).displayName} is AFK**${displayText ? `: ${displayText}` : ''}.`);
        };
        if (message.author.id === id){
            const gDocument = await gModel.findByIdOrCreate(message.guild.id).catch(e => e);
            const index = gDocument.afks.findIndex(user => user.id === message.author.id);
            gDocument.afks.splice(index, 1);
            await gDocument.save().then(async () => {
                afks.delete(message.author.id);
                await message.member.setNickname(message.member.displayName.split(/\[AFK]\s*/).join('')).catch(e => e);
                await message.channel.send(`Welcome back ${message.author}! I removed your AFK status!`)
            });
        };
    };

    if (messages.length){
        await message.reply(messages.join('\n'));
    };
};
