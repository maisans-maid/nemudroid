const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const shop = require('../assets/json/shop.json');
const model = require('../models/userSchema.js');
const moment = require('moment');

const command = new SlashCommandBuilder()
.setName('shop')
.setDescription('Open the shop. View or buy items from the shop')
.addStringOption(option => option
    .setName('type')
    .setDescription('Type of the shop to open')
    .addChoices([
        ['multipliers', 'multipliers'],
        ['others', 'others']
    ])
    .setRequired(true)
);

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        let baseProfiles = await model.find({
            _id: interaction.user.id,
            $and: [
                { 'xp.id': { $eq: interaction.guildId }},
                { 'xp.level': { $gte: 15 }}
            ]
        }, {
            _id: 1,
            'xp.$': 1
        });

        if (baseProfiles instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `<:nemu_confused:883953720373682208> Error: ${baseProfiles.message}`
            });

        const items = shop[interaction.options.getString('type')];
        const selectMenu = new MessageSelectMenu()
            .setDisabled(baseProfiles[0].xp[0].level < 15)
            .setCustomId('shop')
            .setPlaceholder(
                baseProfiles[0].xp[0].level >= 15
                    ? 'Select an item to purchase'
                    : '⚠ You need to reach level 15 first before you can use the shop.'
            )
            .addOptions(items.map(function(item){
                return {
                    value: item.id.toString(),
                    label: `${item.name} (Price: ${item.price})`,
                    description: item.description,
                    emoji: {
                        id: '907495598075306014',
                        name: 'nemu_chibi'
                    }
                }
            }));

        const row = new MessageActionRow()
            .addComponents(selectMenu);

        const content = interaction.options.getString('type') === 'multipliers'
            ? 'Multipliers shop (% bonuses stack)'
            : `${interaction.options.getString('type')} shop`

        const message = await interaction.reply({
            content,
            components: [row],
            fetchReply: baseProfiles[0].xp[0].level >= 15
        });

        if (baseProfiles[0].xp[0].level < 15)
           return;

        const collector = await message.createMessageComponentCollector({
            componentType: 'SELECT_MENU',
            time: 120000
        });

        collector
            .on('collect', async function(i){
                if (i.user.id !== interaction.user.id)
                    return i.reply({
                        ephemeral: true,
                        content: '❌ You are not allowed to control this interaction!'
                    });

                const userProfile = await model
                    .findById(interaction.user.id)
                    .catch(e => e);

                if (userProfile instanceof Error)
                    return i.reply({
                        ephemeral: true,
                        content: '❌ Error: ' + userProfile.message
                    });

                const item = items.find(x => x.id == i.values[0]);

                if (item.price > userProfile.credits)
                    return i.reply({
                        ephemeral: true,
                        content: `You do not have enough credits to purchase **${item.name}**! You need ${(item.price - userProfile.credits).toLocaleString('en-US', { maximumFractionDigits: 0 })} more credits!`
                    });

                userProfile.credits -= item.price;

                let userItem = { id: item.id };
                let response;

                if (interaction.options.getString('type') === 'multipliers'){
                    if (userProfile.xpMultipliers.some(x => x.id === item.id))
                        userItem = userProfile.xpMultipliers.splice(
                            userProfile.xpMultipliers.findIndex(x => x.id === item.id),
                            1
                        )[0];

                    if (!userItem.expiry || userItem.expiry < Date.now())
                        userItem.expiry = Date.now();

                    userItem.expiry += item.duration;
                    userItem.multiplier = item.multiplier;

                    userProfile.xpMultipliers.push(userItem);
                    response = `Successfully purchased **${item.name}**, you now have **${Math.round(100 * (item.multiplier + 1))}%** XP Boost from ${item.name} for ${moment.duration(userItem.expiry - Date.now(), 'milliseconds').format('d [days and] h [hours!]')}`;
                };

                if (interaction.options.getString('type') === 'others'){
                    if (userProfile.inventory.some(x => x.id === item.id))
                        userItem = userProfile.inventory.splice(
                            userProfile.inventory.findIndex(x => x.id === item.id),
                            1
                        )[0];

                    if (userItem.amount === undefined)
                        userItem.amount = 0;

                    userItem.amount++;

                    userProfile.inventory.push(userItem);
                    response = `Successfully purchased 1x **${item.name}**. You now have ${userItem.amount} of this item in your inventory.`;
                };

                return userProfile
                .save()
                .then(() => i.reply({
                    ephemeral: true,
                    content: response
                }))
                .catch(e => i.reply({
                    ephemeral: true,
                    content: `❌ Error: ${e.message}`
                }));
            })
            .on('end', function(collected){
                const replyOptions = {
                    components: [
                        new MessageActionRow()
                            .addComponents(
                                selectMenu
                                .setPlaceholder('⚠️ Session expired.')
                                .setDisabled(true)
                            )
                    ]
                };

                if (collected.last())
                    return collected.last().update(replyOptions);

                return message.edit(replyOptions)
            });
    }
};
