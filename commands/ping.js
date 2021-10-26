const { SlashCommandBuilder } = require('@discordjs/builders');

const command = new SlashCommandBuilder()
.setName('ping')
.setDescription('Check NemDroid\'s ping (Websocket Connection)')

module.exports = {
  builder: command,
  execute: async (client, interaction) => {
    interaction.reply(`\\🏓 Pong! My ping is **${client.ws.ping} ms**.`);
  }
};
