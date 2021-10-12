module.exports = (client, interaction) => {
  try {
    if (!interaction.isCommand()) return;

    const exefunc = client.commands.get(interaction.commandName);

    exefunc(client, interaction);
  } catch (e) {
    console.log('\x1b[33m[!]\x1b[0m ' + e.message);
  }
};
