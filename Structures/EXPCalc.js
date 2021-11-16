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
        this.userDB.credits += 75 + (25 * this.data.level);

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

    if (client.localCache.usersOnVC.has(message.author.id))
        return {
            status: message.author.id + ' is on VC',
            errors: []
        };

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
            return { status, errors: [ guildDB ] };

        if (!(guildDB instanceof GuildDB))
            guildDB = new GuildDB(guildDB);

        let userDB = await UserDB
                .findById(message.author.id) ||
            await new UserDB({ _id: message.author.id })
                .save();

        if (userDB instanceof Error)
            return { status, errors: [ userDB ] };

        const previousLevel = userDB.xp.find(x => x.id === message.guild.id)?.level || 0;

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

          if (previousLevel < userDB.xp.find(x => x.id === message.guild.id).level)
              if (userDB.notifications.levelup)
                  await message.channel.send({
                      ephemeral: true,
                      content: `🎉🎉 ${message.author}, Congratulations for leveling up! You are now level **${userDB.xp.find(x => x.id === message.guild.id).level}**. You received **${75 + (25 * (userDB.xp.find(x => x.id === message.guild.id).level - previousLevel))}** credits as a reward!`
                  });

          return { success, errors };
    };

    return { status: message.author.id + ' is on cooldown', errors: []};
};

async function calculateXPFromVoice(client, voiceState){
    let status = 'fail';

    if (voiceState.member.user.bot)
        return { status, errors: new Error('[CalculateXPFromVoice] the user is a bot.')};

    if (voiceState.mute || voiceState.deaf)
        return { status, errors: new Error('[CalculateXPFromVoice] the user is muted or deafened')};

    let guildDB = client.localCache.guildSchema
            .get(voiceState.guild.id) ||
        await GuildDB.findById(voiceState.guild.id)
            .catch(error => error) ||
        await new GuildDB({ _id: voiceState.guild.id })
            .save();

    if (guildDB instanceof Error)
        return { status, errors: [ guildDB ] };

    if (!(guildDB instanceof GuildDB))
        guildDB = new GuildDB(guildDB);

    let userDB = await UserDB
            .findById(voiceState.member.id) ||
        await new UserDB({ _id: voiceState.member.id })
            .save();

    if (userDB instanceof Error)
        return { status, errors: [ userDB ] };

    const calculation = new EXPCalc(
        userDB,
        guildDB,
        voiceState.member
    );

    const { success, errors } = await calculation
      .add(Math.round(
          _.random(
              EXPDEFAULTS.min / 2,
              EXPDEFAULTS.max / 2
          )
      ))
      .save();

      return { success, errors };
};

module.exports = {
    EXPCalc,
    calculateXPFromMessage,
    calculateXPFromVoice
  };
