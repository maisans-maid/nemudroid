const { SlashCommandBuilder } = require('@discordjs/builders');
const { join } = require('path');

const command = new SlashCommandBuilder()
.setName('reload')
.setDescription('Reload a specific command module')
.addStringOption(option => option
  .setName('command')
  .setDescription('The name of the command to reload')
  .setRequired(true)
)

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    if (interaction.member.id !== '545427431662682112'){
      return interaction.reply(`\\❌ You are not allowed to use this command! Contact my developer if you wish to have access.`);
    };

    const commandName = interaction.options.getString('command');

    if (!client.commands.get(commandName.toLowerCase())){
      return interaction.reply(`\\❌ Command Module for **${commandName}** could not be found.`);
    };

    try {
     delete require.cache[require.resolve(join(__dirname, commandName))];
     const cmdModule = require(join(__dirname, commandName));
     client.commands.set(cmdModule.builder.name, cmdModule.execute);

     return interaction.reply(`\\✔️ Command **${commandName}** has been reloaded.`);

   } catch (err) {
     return interaction.reply(`\\❌ ${err.message}`);
   };
  }
};
