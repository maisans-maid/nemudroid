const { SlashCommandBuilder } = require('@discordjs/builders');
const model = require('../models/userSchema.js');

const command = new SlashCommandBuilder()
.setName('notification')
.setDescription('Set your various bot notifications')
.addStringOption(option => option
    .setName('levelup')
    .setDescription('Enable/Disable bot notification')
    .addChoices([
        [ 'Enable', 'true' ],
        [ 'Disable', 'false' ]
    ])
    .setRequired(true)
)


module.exports = {
    builder: command,
    execute: async (client, interaction) => {

      const levelup = JSON.parse(interaction.options.getString('levelup'));

      const profile = await model.findById(interaction.user.id) ||
          new model({ _id: interaction.user.id });

      if (profile instanceof Error)
          return interaction.reply({
              ephemeral: true,
              content: `<:nemu_confused:883953720373682208> Error: ${profile.message}`
          });

      if (profile.notifications.levelup === levelup)
          return interaction.reply({
              ephemeral: true,
              content: `<:nemu_confused:883953720373682208> Your levelup notifications are already ${levelup ? 'Enabled' : 'Disabled'}!`
          });

      profile.notifications.levelup = levelup;

      return profile
      .save()
      .then(() => interaction.reply({
          ephemeral: true,
          content: `You successfully ${levelup ? 'Enabled' : 'Disabled'} your levelup notifications!`
      }));
    }
};
