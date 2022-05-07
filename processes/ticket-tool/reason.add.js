'use strict';

module.exports = async (client, interaction, profile) => {
    const reason = interaction.options.getString('reason');

    profile.text.supportReasons.push(reason);

    return profile.save()
        .then(() => interaction.reply({
            ephemeral: true,
            content: 'Successfully updated the ticket-tool configuration. Please hit the refresh button 🔃 to update.'
        }))
        .catch(e => interaction.reply({
            content: `❌ Error: ${e.message}`
        }));
};
