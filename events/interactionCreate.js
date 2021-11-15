module.exports = (client, interaction) => {

    if (interaction.isCommand()){
        const exefunc = client.commands
            .get(interaction.commandName);

        if (!exefunc)
          return interaction.reply({
              content: `${interaction.commandName} has no or has missing command module.`,
              ephemeral: true
          });

        try {
            exefunc(client, interaction);
        } catch(e) {
            interaction[
                interaction.deferred || interaction.replied
                  ? 'editReply'
                  : 'reply'
            ]({
                ephemeral: true,
                content: `❌ Error: ${e.message}`
            });
        };
    };

};
