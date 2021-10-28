module.exports = (client, interaction) => {

  if (!interaction.isCommand()) return;

  const exefunc = client.commands.get(interaction.commandName);
  if (!exefunc) return interaction.reply({ content: `${interaction.commandName} has no or has missing command module.`, ephemeral: true });
  exefunc(client, interaction);

};
