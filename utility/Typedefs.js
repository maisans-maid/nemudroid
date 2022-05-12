'use strict';

exports.guildSchemaPartial = class guildSchemaPartial {
    constructor(guild, guildProfile = {}){
        this.client = guild.client;
        this.guildId = guild.id;
        this.channels = {
            verifyId: guildProfile.channels.verification || null,
            loggerId: guildProfile.channels.logger || null,
        };
        this.roles = {
            verifyId: guildProfile.roles.verification || null,
        };
    };

    guild(){
        return this.client.guilds.cache.get(this.guildId) || null
    };

    get loggerChannelId(){
        return this.channels.loggerId;
    };

    get loggerChannel(){
        return this.guild().channels.cache.get(this.loggerChannelId);
    };

    get verificationChannelId(){
        return this.channels.verifyId;
    };

    get verificationChannel(){
        return this.guild().channels.cache.get(this.verificationChannelId);
    };

    get verificationRoleId(){
        return this.roles.verifyId;
    };

    get verificationRole(){
        return this.guild().roles.cache.get(this.verificationRoleId);
    };
};
