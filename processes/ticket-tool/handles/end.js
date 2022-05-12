'use strict';

const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = async function(interaction){

    const editData = await interaction.channel.edit({
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone.id,
                deny: [ 'VIEW_CHANNEL' ]
            },
            ...interaction.channel.permissionOverwrites.cache
                .filter(po => po.type === 'member')
                .map(x => {
                    return {
                        id: x.id,
                        deny: [ 'VIEW_CHANNEL' ]
                    }
                })
        ]
    }).catch(e => e);

    if (editData instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${editData.message}`
        });
    };

    await interaction.update({
      content: 'If you\'re done with the ticket, please click on the button below to close the ticket. You can check the pinned messages to navigate to this message.',
      components: [
          new MessageActionRow().addComponents(
              new MessageButton()
              .setLabel('Dispose Ticket!')
              .setEmoji('📤')
              .setStyle('DANGER')
              .setCustomId('TICKETSYS-END')
              .setDisabled(true)
          )
      ]
    })

    return interaction.channel.send({
        content: 'This ticket has been disposed of!',
        components: [
            new MessageActionRow().addComponents(
                new MessageButton()
                .setLabel('Generate Transcript!')
                .setEmoji('📤')
                .setStyle('SECONDARY')
                .setCustomId('TICKETSYS-DISPOSE')
            )
        ]
    });
};
