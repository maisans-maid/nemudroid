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

module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        async function getProfile(id){
            return await model
                .findById(interaction.user.id)
                .catch(e => e);
        };

        async function sendError(document){
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${document.message}`
            });
        };

        function getLevel(userProfile){
            return userProfile
                ? userProfile.xp
                    .find(x => x.id === interaction.guildId)?.level || 0
                : 0;
        };

        const authorProfile = await getProfile(interaction.user.id);

        if (authorProfile instanceof Error)
            return sendError(authorProfile);

        const level = getLevel(authorProfile);

        const allowed = level >= 15;

        let placeholder = allowed
            ? 'Select item to purchase'
            : 'You need to reach level 15 to use the shop!'

        const items = shop[interaction.options.getString('type')];
        const selectMenu = new MessageSelectMenu()
            .setCustomId('shop')
            .setPlaceholder(placeholder)
            .setDisabled(!allowed)
            .addOptions(items.map(function(item){
                return {
                    value: item.id.toString(),
                    label: `${item.name} (Price: ${item.price})`,
                    description: item.description,
                    emoji: {
                        id: '902592481286320148',
                        name: 'Facebook'
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
            fetchReply: allowed
        });

        if (!allowed)
           return;

        const collector = await message.createMessageComponentCollector({
            componentType: 'SELECT_MENU',
            time: 120000
        });

        collector
            .on('collect', async function(i){
                const userProfile = i.user.id === interaction.user.id
                    ? authorProfile
                    : await getProfile(i.user.id);

                if (userProfile instanceof Error)
                    return i.reply({
                        ephemeral: true,
                        content: `❌ Error: ${userProfile.error}`
                    });

                if (getLevel(userProfile) < 15)
                    return i.reply({
                        ephemeral: true,
                        content: 'You need to reach level 15 to use the shop!'
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
