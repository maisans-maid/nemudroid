const { GuildMember, Collection } = require('discord.js');
const UserDB  = require('../models/userSchema.js');
const GuildDB = require('../models/guildSchema.js');
const _ = require('lodash');

const EXPDEFAULTS = {
  min: 20,
  max: 30,
  multiplier: 1
  // multiplier may change depending on events
  // For example, Halloween events may have double xp rewards
  // This is independent from user-purchased xp boosts
}

class EXPCalc {
    constructor(userDB, guildDB, guildMember){
        if (!(userDB instanceof UserDB))
            throw new Error('EXPCalc parameter[0] must be an instance of the userSchema document.');

        if (!(guildDB instanceof GuildDB))
            throw new Error('EXPCalc parameter[1] must be an instance of the guildSchema document.');

        if ((!guildMember instanceof GuildMember))
            throw new Error('EXPCalc parameter[2] must be an instance of DiscordJS GuildMember');

        this.userDB = userDB;
        this.guildDB = guildDB;
        this.member = guildMember;

        this._index = this.userDB.xp.findIndex(
            x => x.id === this.member.guild.id
        );


        if (this._index < 0){
            this.userDB.xp.push({
                xp: 0,
                id: this.member.guild.id,
                level: 1
            });
            this.index = this.userDB.xp.findIndex(
                x => x.id === this.member.guild.id
            );
        };

        this.data = this.userDB.xp.splice(this._index, 1)[0];
        this.roles = [];
    };

    add(amount){

        // Clears out expired items
        this.userDB.xpMultipliers = this.userDB.xpMultipliers
            .filter(x => x.expiry > Date.now());

        const multiplier = this.userDB.xpMultipliers
            .reduce((acc, cur) =>
                acc + cur.multiplier || 0,
                EXPDEFAULTS.multiplier
            );

        this.data.xp += Math.round(amount * multiplier);

        while (
            this.next(
                this.data.level,
                this.data.xp
            ) < 1
        ) this._incrementLevel();

        return this;
    };

    _incrementLevel(){
        this.data.level ++;

        const { rewards } = this.guildDB;

        const roles = [ ...Array(this.data.level + 1).keys()]
            .slice(1)
            .map(level => this
                .member.guild.roles.cache.get(
                    rewards.find(
                        x => x.level === level
                    )?.role
                )?.id
            )
            .filter(Boolean);

        this.roles = [...new Set(roles.concat(this.roles))];

        return this;
    };

    async save(){
        let errors = [];
        let success = false;
        if (this.roles.length)
            try {
                await this.member.roles.add(this.roles);
            } catch (e) {
                errors.push(e);
            };

        if (this.userDB.xp.some(x => x.id === this.data.id ))
            return { success, errors: 'Multiple data found for this guild'}

        this.userDB.xp.push(this.data);

        try {
            await this.userDB.save();
            success = true;
        } catch (e) {
            errors.push(e);
        };

        // Success refers to if the document was actually saved
        // There may be times that it was successfull but it came with errors
        // like unable to add roles because of MISSINGPERMS.
        return { success, errors };
    };

    cap(level){
        return 50 * Math.pow(level, 2) + 250 * level;
    };

    next(level, xp){
        return this.cap(level) - xp;
    };
};

async function calculateXPFromMessage(client, message){
    let status = 'fail';
    let guildCache = client.localCache.talkingUsers
        .get(message.guild.id);

    if (!guildCache)
        guildCache = client.localCache.talkingUsers
            .set(message.guild.id, new Collection())
            .get(message.guild.id);

    const timestamp = guildCache.get(message.author.id) || 0;

    if (timestamp + 6e4 < Date.now()){
        let guildDB = client.localCache.guildSchema
                .get(message.guild.id) ||
            await GuildDB.findById(message.guild.id)
                .catch(error => error) ||
            await new GuildDB({ _id: message.guild.id })
                .save();

        if (guildDB instanceof Error)
            return { status, errors: [ Error ] };

        let userDB = await UserDB
                .findById(message.author.id) ||
            await new UserDB({ _id: message.author.id })
                .save();

        if (userDB instanceof Error)
            return { status, errors: [ Error ] };

        const calculation = new EXPCalc(
            userDB,
            guildDB,
            message.member
        );

        const { success, errors } = await calculation
          .add(Math.round(
              _.random(
                  EXPDEFAULTS.min,
                  EXPDEFAULTS.max
              )
          ))
          .save();

          if (success)
              client.localCache.talkingUsers
                  .get(message.guild.id)
                  .set(message.author.id, Date.now());

          return { success, errors };
    };

    return { status: message.author.id + ' is on cooldown', errors: []};
};

module.exports = { EXPCalc, calculateXPFromMessage };