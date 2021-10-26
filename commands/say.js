const { SlashCommandBuilder, hideLinkEmbed } = require('@discordjs/builders');
const { FLAGS } = require('discord.js').Permissions;

const command = new SlashCommandBuilder()
.setName('say')
.setDescription('Say something using the bot')
.addStringOption(option => option
  .setName('content')
  .setDescription('The content of the message to be sent.')
  .setRequired(true)
)
.addChannelOption(option => option
  .setName('channel')
  .setDescription('The channel you want the message to be sent. Defaults to the current channel.')
)


module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    if (!interaction.member.permissions.has(FLAGS.MANAGE_GUILD)){
      return interaction.reply({ content: `You are not allowed to use this command!`, ephemeral: true });
    };

    const content = interaction.options.getString('content');
    const channel = interaction.options.getChannel('channel');

    if (channel){
      if (!channel.isText()){
        return interaction.reply({ ephemeral: true, content: `\\❌ The selected channel is not a [**\`Text-based Channel\`**](${hideLinkEmbed('https://discord.js.org/#/docs/main/stable/typedef/TextBasedChannels')})`})
      };
      return channel.send(content)
      .then(() => interaction.reply({ content: '\\✔️ Message has been delivered!', ephemeral: true }))
      .catch(e => interaction.reply({ content: `\\❌ ${e.message}`, ephemeral: true }));
    } else {
      return interaction.channel.send(content)
      .then(() => interaction.reply({ content: '\\✔️ Message has been delivered!', ephemeral: true }))
      .catch(e => interaction.reply({ content: `\\❌ ${e.message}`, ephemeral: true }));
    };
  }
};
