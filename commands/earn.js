
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection } = require('discord.js');
const moment = require('moment');
const model = require('../models/userSchema.js');
const _ = require('lodash');

const command = new SlashCommandBuilder()
.setName('earn')
.setDescription('Various ways to earn credits')
.addStringOption(option => option
  .setName('method')
  .setDescription('In what way would you like to earn credits?')
  .addChoices([
    [ 'Claim Daily Reward', 'daily'],
    [ 'Play RPS (Janken)', 'rps' ],
    [ 'Play Coinflip', 'coinflip' ],
    [ 'Play Hangman', 'hangman' ],
    [ 'Play Minesweeper', 'minesweeper'],
    [ 'Guess captcha', 'captcha' ],
    [ 'Find', 'find' ],
    [ 'Beg', 'beg' ]
  ])
  .setRequired(true)
)


module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const method = interaction.options.getString('method');

    if (method === 'daily'){
        const profile = await model
            .findById(interaction.user.id)
            .catch(e => e) ||
            new model({ _id : interaction.user.id });

      if (profile instanceof Error)
          return interaction.reply({
              ephemeral: true,
              content: `:x: Error ${profile.message}`
          });

      if (profile.daily.timestamp - Date.now() > 0)
          return interaction.reply({
              content: ':x: You already got your daily reward. You can get your next daily reward ' + moment(profile.daily.timestamp).fromNow() + '.'
          });

      if (profile.daily.timestamp.getTime() + 864e5 < Date.now())
          profile.daily.currentstreak = 0;

      profile.daily.currentstreak++;

      if (profile.daily.highteststreak < profile.daily.currentstreak)
          profile.daily.highteststreak = profile.daily.currentstreak;

      profile.daily.timestamp = Date.now() + 72e6;

      const baseAmount = 75;
      const additionalAmount = 5 * (profile.daily.currentstreak - 1);

      profile.credits += baseAmount + additionalAmount;

      const totalAmount = (baseAmount + additionalAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })

      return profile
      .save()
      .then(() => interaction.reply({
          content: `:tada: **${interaction.user.tag}**, You got <a:coin:907310108550266970>**${totalAmount}** credits for your daily reward. (Streak x${profile.daily.currentstreak}). Maintain your streak to receive even higher rewards!`
      }))
      .catch(e => interaction.reply({
          ephemeral: true,
          content: `:x: Error: ${e.message}`
      }));

    } else if (method === 'beg'){

      const gameCache = client.localCache.games.get(method) ||
      client.localCache.games.set(method, new Collection())
      .get(method);

      const timestamp = gameCache.get(interaction.user.id);

      if (timestamp + 144e5 > Date.now())
          return interaction.reply({
            ephemeral: true,
            content: `You recently used this method. Please wait ${moment(timestamp + 144e5).fromNow()} to use this method again.`
          });

      let response;

      const profile = await model
      .findById(interaction.user.id)
      .catch(e => e) ||
      new model({ _id : interaction.user.id });

      if (profile instanceof Error)
      return interaction.reply({
        ephemeral: true,
        content: `:x: Error ${profile.message}`
      });

      const reward = _.random(10,20);

      if (['find', 'beg'].includes(method)){
          profile.credits += reward;
          response = `Got <a:coin:907310108550266970> **${reward}**!`
      } else {
          const victims = model.find({
              credits: {
                  '$gte': 50
              },
              'xp.id': interaction.guildId
          });

          if (!victims.length)
              return interaction.reply({
                  ephemeral: true,
                  content: 'Users in this server has no credits.'
              });

          const victim = model.findById(
              victims[_.random(0, victims.length - 1)]._id
          );

          victim.credits -= reward;
          profile.credits += reward;

          await victim.save();

          response = `Successfully stole <a:coin:907310108550266970>**${reward}** from <@${victim._id}>!`
      };

      return profile
      .save()
      .then(() => {
          gameCache.set(interaction.user.id, Date.now());

          return interaction.reply({
            content: response
          });
      })
      .catch(e => interaction.reply({
        ephemeral: true,
        content: `:x: Error: ${e.message}`
      }));
    } else {

      const gameModule = require(`../util/games/${method}.js`);
      return gameModule(interaction);
    };
  }
};
