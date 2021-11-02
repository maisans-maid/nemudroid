const { SlashCommandBuilder } = require('@discordjs/builders');
const shop = require('../assets/json/shop.json');
const model = require('../models/userSchema.js');
const moment = require('moment');

const command = new SlashCommandBuilder()
.setName('buy')
.setDescription('Buy various items from the shop')
.addSubcommand(subcommand => subcommand
    .setName('multipliers')
    .setDescription('Buy XP multipliers from the shop')
    .addStringOption(option => option
        .setName('item')
        .setDescription(`[Price] (Percent gain, duration) Item Name. You can also view detailed description on /shop command`)
        .addChoices([
          ["[  100] (110%, 1 hour) Carrot Seeds"     , '1'],
          ["[  250] (110%, 3 hours) Carrot Seedlings", '2'],
          ["[  450] (110%, 6 hours) Carrot Sprout"   , '3'],
          ["[  475] (150%, 1 hour) Normal Carrot"    , '4'],
          ["[ 1200] (150%, 3 hours) Fresh Carrot"    , '5'],
          ["[ 2100] (150%, 6 hours) Cleaned Carrot"  , '6'],
          ["[ 3800] (150%, 12 hours) Cooked Carrot"  , '7'],
          ["[ 7000] (200%, 1 day) Blessed Carrot"    , '8'],
          ["[10000] (300%, 1 day) Rainbow Carrot"    , '9'],
          ["[15000] (500%, 1 day) Divine Carrot"    , '10']
        ])
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('others')
    .setDescription('Buy items that you may find useful from the shop')
    .addStringOption(option => option
        .setName('item')
        .setDescription('You can view the description of each item by using the /shop command.')
        .addChoices([
          ["Wallpaper Change Scroll", '201'],
          ["Custom Tag Scroll",       '202']
        ])
        .setRequired(true)
    )
);

module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        const timeout = setTimeout(
          () => !interaction.replied
              ? interaction.deferReply()
              : null,
          2750
        );

        const subcommand = interaction.options.getSubcommand();
        const itemID     = interaction.options.getString('item');
        const items      = shop[subcommand];
        const item       = items.find(x => x.id == itemID);

        if (!item)
            return interaction[
                interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
                ephemeral: true,
                content: 'Error: The item does not exist.'
            });

        const userProfile = await model
                .findById(interaction.user.id)
                .catch(e => e) ||
            await new model({ _id: interaction.user.id })
                .save()
                .catch(e => e);

        if (userProfile instanceof Error)
            return interaction[
                interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
                ephemeral: true,
                content: `Error: ${Error.message}`
            });

        if (item.price > userProfile.credits)
            return interaction[
                interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
                ephemeral: true,
                content: `You do not have enough credits to purchase **${item.name}**! You need ${(item.price - userProfile.credits).toLocaleString('en-US', { maximumFractionDigits: 0 })} more credits!`
            });

        let userItem = { id: item.id };

        if (subcommand === 'multipliers'){
            if (userProfile.xpMultipliers.some(x => x.id === item.id))
                userItem = userProfile.xpMultipliers
                    .splice(
                        userProfile.xpMultipliers.findIndex(x => x.id === item.id),
                        1
                    )[0];

            if (!userItem.expiry || userItem.expiry < Date.now())
                userItem.expiry = Date.now();

            userItem.expiry += item.duration;
            userItem.multiplier = item.multiplier;

            userProfile.xpMultipliers.push(userItem);

            return userProfile
                  .save()
                  .then(() => interaction[
                    interaction.deferred
                    ? 'editReply'
                    : 'reply'
                ]({
                    ephemeral: true,
                    content: `Successfully purchased **${item.name}**, you now have **${Math.round(100 * (item.multiplier + 1))}%** XP Boost from ${item.name} for ${moment.duration(userItem.expiry - Date.now(), 'milliseconds').format('d [days and] h [hours!]')}`
                }))
                .catch(e => interaction[
                    interaction.deferred
                    ? 'editReply'
                    : 'reply'
                ]({
                    ephemeral: true,
                    content: `Error: ${e.message}`
                }));
        };

        if (subcommand === 'others'){
            if (userProfile.inventory.some(x => x.id === item.id))
                userItem = userProfile.inventory
                    .splice(
                        userProfile.inventory.findIndex(x => x.id === item.id),
                        1
                    )[0];

            if (userItem.amount === undefined)
                userItem.amount = 0;

            userItem.amount++;

            userProfile.inventory.push(userItem);

            return userProfile
            .save()
            .then(() => interaction[
                interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
                ephemeral: true,
                content: `Successfully purchased 1x **${item.name}**. You now have ${userItem.amount} of this item in your inventory.`
            }))
            .catch(e => interaction[
                interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
                ephemeral: true,
                content: `Error: ${e.message}`
            }));
        };
    }
};
