'use strict';

module.exports = async (client, interaction, profile) => {
    const reason = interaction.options.getInteger('reason');
    const newReason = interaction.options.getString('new-reason');

    if (reason < 1){
        return interaction.reply({
            ephemeral: true,
            content: '❌ Error: Invalid number. Please enter the number of the reason you want to remove as it appears on the list.'
        });
    };

    if (typeof profile.text.supportReasons[reason] !== 'string'){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Error: Invalid number. Please enter the number of the reason you want to remove as it appears on the list.`
        });
    };

    profile.text.supportReasons.splice(reason - 1, 1, newReason);

    return profile.save()
        .then(() => interaction.reply({
            ephemeral: true,
            content: 'Successfully updated the ticket-tool configuration. Please hit the refresh button 🔃 to update.'
        }))
        .catch(e => interaction.reply({
            content: `❌ Error: ${e.message}`
        }));
}
