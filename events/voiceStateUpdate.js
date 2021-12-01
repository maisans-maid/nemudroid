const { VoiceChannel, Collection } = require('discord.js');
const { calculateXPFromVoice } = require('../Structures/EXPCalc.js');

module.exports = (client, oldState, newState) => {

    // If guild is not nemu's do not execute.
    if (newState.member.guild.id !== '874162813977919488')
        return;

    const date = Date.now()

    if (
      oldState.member.user.bot ||
      newState.member.user.bot
    ) return;

    // Joins a voice channel
    if (newState.channel instanceof VoiceChannel){
        // Moved to another channel
        // Do not instantiate again to prevent duplicate intervals
        if (oldState.channel instanceof VoiceChannel)
            return;

        const interval = setInterval(function(){
            return calculateXPFromVoice(client, newState);
        }, 60000);

        client.localCache.usersOnVC
            .set(
                newState.member.id,
                interval[Symbol.toPrimitive]()
            );
    };

    // Leaves a voice channel
    if (!newState.channel){
        const IntervalProcessId = client.localCache.usersOnVC
            .get(newState.member.id);

        clearTimeout(IntervalProcessId);

        (client.localCache.talkingUsers
              .get(newState.guild.id) ||
         client.localCache.talkingUsers
              .set(newState.guild.id, new Collection())
              .get(newState.guild.id)
         )
              .set(newState.member.id, Date.now());

        client.localCache.usersOnVC
            .delete(newState.member.id);
    };
};
