const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Collection, Permissions } = require('discord.js');
const moment = require('moment');
const gModel = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('clearmessages')
.setDescription('Bulk delete messages that are newer than two (2) weeks.')
.addIntegerOption(option => option
    .setName('amount')
    .setDescription('Amount of messages to delete')
    .setRequired(true)
    .setMinValue(1)
);

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_MESSAGES'),
    execute: async (client, interaction) => {
        const amount = interaction.options.getInteger('amount');
        let messages = new Collection();

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')){
            return interaction.reply({
                ephemeral: true,
                content: '❌ You have no permission to manage messages!'
            });
        };

        if (amount < 1){
            return interaction.reply({
                ephemeral: true,
                content: '❌ Int value should be greater than or equal to 1'
            })
        };

        let value, quantities = Array.from({ length: Math.floor(amount / 99) }, () => 99).concat([ amount % 99 ]);

        await interaction.reply({
            content: 'Messages are being deleted. Please wait...\n\nNote: New messages may be deleted if this operation is running while the new message is being sent.',
            ephemeral: true
        });

        try {
            while (value = quantities.splice(0,1)[0]){
                const cooldown = col => new Promise(resolve => setTimeout(() => resolve(col), 1_000));
                const deleted = await interaction.channel.bulkDelete(value, true).then(cooldown);

                messages = messages.concat(deleted);

                if (value >= deleted.size){
                    quantities.length = 0;
                };
            }
        } catch (e) {
            return interaction.followUp({
                content: `❌ An error has occured before the operation has completed: ${e.message}\n\n*(**${messages.size}** message was deleted before the operation was terminated)*`
            });
        };

        if (!messages.size){
            return interaction.followUp({
                content: '⚠ Operation was completed successfully. No messages were deleted.'
            });
        };

        const gDocument = await gModel.findByIdOrCreate(interaction.guildId).catch(e => e);

        if (gDocument instanceof Error){
            return interaction.followUp({
                content: `✅ Successfully deleted **${messages.size}** messages!\n\n⚠ Unable to access server gDocument. Deleted messages has not been saved.`
            })
        };

        if (!gDocument.channels.clearMessages){
            return interaction.followUp({
                content: `✅ Successfully deleted **${messages.size}** messages!\n\nℹ You can keep a copy of deleted messages by assigning an upload channel through \`\setchannel\` command.`
            });
        };

        const channel = interaction.guild.channels.cache.get(gDocument.channels.clearMessages);

        if (!channel){
            return interaction.followUp({
                content: `✅ Successfully deleted **${messages.size}** messages!\n\n⚠ Could not create a copy of deleted messages. Please reassign an upload channel.`
            });
        };

        const size   = messages.size;
        const header = `Messages Cleared on ![](${interaction.guild.iconURL({ size: 32 })}) **${interaction.guild.name}** - **${interaction.channel.name}** --\r\n\r\n`;
        const mapFunction = message => `[${moment(message.createdTimestamp).format('dddd, Do MMMM YYYY hh:mm:ss')}] ${message.author.tag} : ${message.content || `[*This is probably an Embed or Image*]`}\r\n\r\n`;
        const filterFunction = message => Boolean(message) && typeof message === 'object' && Object.values(message).length && message.createdAt && message.author;

        messages = messages.filter(filterFunction).sort((a,b) => b.createdAt - a.createdAt).map(mapFunction).concat([header]).reverse().join('');

        const res = size ? await channel.send({
            files: [{
                attachment: Buffer.from(messages),
                name: 'BULKDELETE.txt'
            }]
        }).catch(() => {}) : undefined;

        const view = res ? `[\`📄 View\`](https://txt.discord.website/?txt=${channel.id}/${res.attachments.first().id}/BULKDELETE)` : '';
        const download = res ? `[\`🔽 Download\`](${res.attachments.first().url})` : '';

        const response = {
            content: `✅ Successfully deleted **${size}** messages!`
        };

        if (res){
            response.embeds = [
                new MessageEmbed()
                    .setColor('GREY')
                    .setDescription(view + '\u2000\u2000 | \u2000\u2000' + download)
                ]
        };

        return interaction.followUp(response);
    }
};
