'use strict';

const gModel = require('../../models/guildSchema.js');
const { Collection } = require('discord.js');

module.exports = async client => {
    for (const [id] of client.guilds.cache){
        const gDocument = await gModel.findByIdOrCreate(id).catch(e => e);
        if (gDocument instanceof Error){
            return console.log(`AFK_INITIALIZE: Error on Document fetch (guildSchema) -> ${gDocument.message}`)
        };

        let afks = client.custom.cache.afkUsers.get(id);
        if (!afks) afks = client.custom.cache.afkUsers.set(id, new Collection()).get(id);

        for (const afk of gDocument.afks){
            afks.set(afk.id, afk.displayText);
        };
    };
};
