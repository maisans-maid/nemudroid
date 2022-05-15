'use strict';

const _ = require('lodash');

const { Collection } = require('discord.js');
const uModel = require('../models/userSchema');
const gModel = require('../models/guildSchema');
const afkScan = require('../processes/afk-scanner/scan.js');

module.exports = async (client, message) => {
    if (message.author.bot) return;

    // Scan messages for AFK
    afkScan(message);

    /*==================EXP=PROC=================*/
    let guildCache = client.custom.cache.messageXP.get(message.guild.id);
    if (!guildCache) guildCache = client.custom.cache.messageXP.set(message.guild.id, new Collection()).get(message.guild.id);

    const timestamp = guildCache.get(message.author.id);
    if ((timestamp || 0) + 60_000 < Date.now()){
        let gDocument = await gModel.findByIdOrCreate(message.guild.id);
        if (gDocument instanceof Error){
            return console.log(`ADD_XP_BY_MESSAGE: Error on Document fetch (guildSchema) -> ${gDocument.message}`);
        };
        let uDocument = await uModel.findByIdOrCreate(message.author.id);
        if (uDocument instanceof Error){
            return console.log(`ADD_XP_BY_MESSAGE: Error on Document fetch (userSchema) -> ${uDocument.message}`);
        };
        const res = uDocument.addXP(message.guild.id, _.random(10, 20));
        if (!res){
            return console.log(`ADD_XP_BY_MESSAGE: Error on Document.addXP -> function returned ${res}`);
        };
        await uDocument.save()
            .then(async () => {
                // on.levelup
                if (res.before.level < res.after.level){
                    const roleRewards = [...Array(res.after.level + 1).keys()].slice(1)
                        .map(level => message.guild.roles.cache.get(gDocument.roles.rewards.find(r => r.level == level)?.role)?.id).filter(Boolean);
                    if (roleRewards.length){
                        await message.member.roles.add(roleRewards)
                            .catch(c => console.log(`ADD_XP_BY_MESSAGE: Error on adding Role -> ${c.message}`));
                    };
                    if (uDocument.notifications?.levelup){
                        await message.channel.send({
                            ephemeral: true,
                            content: `🎉🎉 ${message.author}, Congratulations for leveling up! You are now level **${res.after.level}**.`
                        });
                    };
                };
                client.custom.cache.messageXP.get(message.guild.id).set(message.author.id, Date.now());
            })
            .catch(e => console.log(`ADD_XP_BY_MESSAGE: Error on Document.save -> ${e.message}`));
    };
    /*==============END=EXP=PROC=================*/
};
