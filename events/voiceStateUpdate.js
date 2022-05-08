'use strict';

const { VoiceChannel, Collection } = require('discord.js');
const gModel = require('../models/guildSchema.js');
const uModel = require('../models/userSchema.js');
const _ = require('lodash');

module.exports = async (client, oldState, newState) => {
    const date = Date.now();

    if (newState.member.user.bot) return;
    if (newState.channel instanceof VoiceChannel){
        if (oldState.channel instanceof VoiceChannel) return;

        const interval = setInterval(async function(){
            if (newState.mute || newState.deaf) return;

            const gDocument = await gModel.findByIdOrCreate(newState.guild.id);
            if (gDocument instanceof Error){
                return console.log(`ADD_XP_BY_VOICE: Error on Document fetch (guildSchema) -> ${gDocument.message}`);
            };
            const uDocument = await uModel.findByIdOrCreate(newState.member.id);
            if (uDocument instanceof Error){
                return console.log(`ADD_XP_BY_VOICE: Error on Document fetch (userSchema) -> ${uDocument.message}`);
            };
            const res = uDocument.addXP(newState.guild.id, _.random(5,10));
            if (!res){
                return console.log(`ADD_XP_BY_VOICE: Error on Document.addXP - > function returned ${res}`);
            };
            await uDocument.save()
                .then(async () => {
                    const roleRewards = [...Array(res.after.level + 1).keys()].slice(1)
                        .map(level => newState.guild.roles.cache.get(gDocument.roles.rewards.find(r => r.level === level)?.role)?.id).filter(Boolean);
                    if (roleRewards.length){
                        await message.member.roles.add(roleRewards)
                            .catch(c => console.log(`ADD_XP_BY_VOICE: Error on adding Role -> ${c.message}`));
                    };
                })
                .catch(e => console.log(`ADD_XP_BY_VOICE: Error on Document.save -> ${e.message}`));
        }, 90_000);

        client.custom.cache.voiceChannelXP.set(newState.member.id, interval[Symbol.toPrimitive]());
    };

    if (!newState.channel){
        const intervalProcessId = client.custom.cache.voiceChannelXP.get(newState.member.id);
        clearTimeout(intervalProcessId);
        client.custom.cache.voiceChannelXP.delete(newState.member.id);
    };
};
