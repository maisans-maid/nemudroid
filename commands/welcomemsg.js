const { SlashCommandBuilder, hideLinkEmbed } = require('@discordjs/builders');
const { FLAGS } = require('discord.js').Permissions;
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('welcomemsg')
.setDescription('Set the behavior of the welcome message!')

.addSubcommandGroup(group => group
  .setName('manage')
  .setDescription('Manage the channel and/or the text-message for this feature.')
  .addSubcommand(subcommand => subcommand
    .setName('channel')
    .setDescription('Set the channel for the welcome message!')
    .addChannelOption(option => option
      .setName('target')
      .setDescription('The channel to use for this feature!')
      .setRequired(true)
    )
  ) // channel
  .addSubcommand(subcommand => subcommand
    .setName('message')
    .setDescription('Adds/Disable Text message inclusion for the welcome message.')
    .addStringOption(option => option
      .setName('action')
      .setDescription('What to do with the text message.')
      .addChoices([
        ['Set Text-Message', 'set'],
        ['Disable Text-Message', 'disable'],
      ])
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName('content')
      .setDescription('The content of the message to include.')
    )
  ) // message
)
.addSubcommand(subcommand => subcommand
  .setName('enable')
  .setDescription('Enable this feature.')
 )
.addSubcommand(subcommand => subcommand
  .setName('disable')
  .setDescription('Disable this feature')
)
.addSubcommand(subcommand => subcommand
  .setName('test')
  .setDescription('Test the message')
);


module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    if (!interaction.memberPermissions.has(FLAGS.MANAGE_GUILD)){
      return interaction.reply({ content: `You are not allowed to use this command!`, ephemeral: true });
    };

    let profile = await model.findById(interaction.guild.id);
    if (!profile) profile = await new model({ _id: interaction.guild.id }).save();
    if (profile instanceof Error) profile = client.localCache.guildSchema.get(interaction.guild.id);
    if (!profile) return interaction.reply('\\❌ Could not connect to database');

    if (['enable', 'disable'].includes(interaction.options._subcommand)){
      const btn = { enable: true, disable: false }
      const channel = interaction.guild.channels.cache.get(profile.greeter.welcome.channel);
      const message = (interaction.options._subcommand === 'enable') && !channel ? '\\⚠️ Channel not set. Please set the channel to activate this feature.' : '' ;
      if (profile.greeter.welcome.isEnabled === btn[interaction.options._subcommand]){
        return interaction.reply(`\\⚠️ The **welcomemsg feature** has already been ${interaction.options._subcommand.toUpperCase()}D!\n${message}`);
      } else {
        profile.greeter.welcome.isEnabled = !profile.greeter.welcome.isEnabled;
        return profile.save()
        .then(() => {
          client.localCache.guildSchema.set(interaction.guild.id, new model(profile).toJSON());
          return interaction.reply(`\\✔️ The **welcomemsg feature** has been ${interaction.options._subcommand}d!\n${message}`);
        })
        .catch(error => {
          return interaction.reply(`\\❌ The Following Error was encountered: ${error.message}`);
        });
      }
    };

    if (interaction.options._subcommand === 'channel'){
      if (interaction.options._hoistedOptions[0].type === 'CHANNEL'){
        const channel      = interaction.options._hoistedOptions[0].value;
        const guildChannel = interaction.guild.channels.cache.get(channel)
        if (!guildChannel.isText()){
          return interaction.reply(`\\❌ The selected channel is not a [**\`Text-based Channel\`**](${hideLinkEmbed('https://discord.js.org/#/docs/main/stable/typedef/TextBasedChannels')})`);
        };
        profile.greeter.welcome.isEnabled = true;
        profile.greeter.welcome.channel   = channel
        return profile.save()
        .then(() => {
          client.localCache.guildSchema.set(interaction.guild.id, new model(profile).toJSON());
          return interaction.reply(`\\✔️ Welcomemsg set to ${interaction.options._hoistedOptions[0].channel}`);
        })
        .catch(error => {
          return interaction.reply(`\\❌ The Following Error was encountered: ${error.message}`);
        });
      } else {
        //
      };
    };

    if (interaction.options._subcommand === 'message'){
      if (interaction.options._hoistedOptions.find(x => x.name === 'action').value === 'set'){
        const content = interaction.options._hoistedOptions.find(x => x.name === 'content');
        if (!content){
          return interaction.reply(`\\⚠️ You need to provide the message content. You can use modifiers as well.`);
        };
        profile.greeter.welcome.message.text = content.value;
        profile.greeter.welcome.message.isEnabled = true;
        return profile.save()
        .then(() => {
          client.localCache.guildSchema.set(interaction.guild.id, new model(profile).toJSON());
          return interaction.reply(`\\✔️ Text message has been added to welcomemsg!`);
        })
        .catch(error => {
          return interaction.reply(`\\❌ The Following Error was encountered: ${error.message}`);
        });
      } else {
        profile.greeter.welcome.message.text = null;
        profile.greeter.welcome.message.isEnabled = false;
        return profile.save()
        .then(() => {
          client.localCache.guildSchema.set(interaction.guild.id, new model(profile).toJSON());
          return interaction.reply(`\\✔️ Text message has been removed from welcomemsg!`);
        })
        .catch(error => {
          return interaction.reply(`\\❌ The Following Error was encountered: ${error.message}`);
        });
      };
    };

    if (interaction.options._subcommand === 'test'){
      client.emit('guildMemberAdd', interaction.member);
      return interaction.reply(`\\✔️ Message was sent!`);
    };
  }
};
