'use strict';

const { MessageActionRow, MessageButton } = require('discord.js');

const handleTicket = require('../processes/ticket-tool/handles/main.js');
const handlePoll = require('../processes/poll/poll.handle.js');

const levelCanvas = require('../utility/Canvas.level.js');
const leaderboardPagination = require('../buttons/leaderboard.js');

module.exports = async (client, interaction) => {
    if (interaction.isCommand()){
        const command = client.custom.commands.get(interaction.commandName);
        if (!command){
            return interaction.reply({
                ephemeral: true,
                content: `**${interaction.commandName}** has none or has missing command module.`
            });
        };
        try {
            command.execute(client, interaction);
        } catch (e) {
            const error = {
                ephemeral: true,
                content: `❌ Error: ${e.message}`
            };
            if (interaction.deferred || interaction.replied){
                return interaction.editReply(error);
            } else {
                return interaction.reply(error);
            };
        };
    };

    if (interaction.isButton()){
        handleTicket(interaction);
        handlePoll(interaction);
        leaderboardPagination(interaction);

        if (interaction.customId.startsWith('level')){
            const userId = interaction.customId.split('-')[1];
            const profile = interaction.customId.split('-')[2];

            interaction.reply({
                ephemeral: true,
                content: '🔒 This feature is currently locked!'
            })

            // await interaction.deferUpdate();
            //
            // const attachment = await levelCanvas({ profile,
            //     member: await interaction.guild.members.fetch(userId),
            //     guild: interaction.guild
            // });
            //
            // interaction.message.edit({
            //     files: [],
            //     files: [{ attachment, name: 'rank.png'}],
            //     components: [
            //         new MessageActionRow().addComponents(
            //             new MessageButton()
            //                 .setCustomId(`level-${interaction.member.id}-${['light', 'dark'].find(x => x!== profile)}`)
            //                 .setLabel(`View in ${['Light', 'Dark'].find(x => x.toLowerCase() !== profile)} Mode`)
            //                 .setStyle('SECONDARY')
            //                 .setEmoji({'light':'🌙', 'dark':'⛅'}[profile])
            //         )
            //     ]
            // });
        };
    };
};
