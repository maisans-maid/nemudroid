const { SlashCommandBuilder, hideLinkEmbed } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const command = new SlashCommandBuilder()
.setName('intro')
.setDescription('Manage/view member introductions.')
.addSubcommand(subcommand => subcommand
  .setName('user')
  .setDescription('View user introduction.')
  .addUserOption(option => option
    .setName('target')
    .setDescription('Whose introduction would you like to see?')
    .setRequired(true)
  )
)
.addSubcommand(subcommand => subcommand
  .setName('channel')
  .setDescription('Select introduction channel.')
  .addChannelOption(option => option
    .setName('target')
    .setDescription('Which channel would you like me to retrieve introduction messages from?')
    .setRequired(true)
  )
)
.addSubcommand(subcommand => subcommand
  .setName('disable-channel')
  .setDescription('Disable this feature')
)

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const profile = await client.database.models.guildSchema.findById(interaction.guild.id);
    if (!profile){
      profile = new client.database.models.guildSchema({_id: interaction.guild.id});
    };
    if (profile instanceof Error){
      profile = client.localcache.serverprofiles[interaction.guild.id];
    };
    if (!profile){
      return interaction.reply('\\❌ Could not connect to database');
    };

    if (interaction.options.getSubcommand() === 'user'){
      const user    = interaction.options.getUser('target');
      const channel = interaction.guild.channels.cache.get(profile.introduction.channel);

      if (profile.introduction.channel === null){
      // Channel not set
      return interaction.reply(`\\⚠️ Channel for fetching introduction message not set. Please have the server managers set the channel first!`)
      } else if (!channel){
      // Channel has been deleted
      return interaction.reply(`\\❌ Channel for fetching introduction message could not be found. Channel may have been deleted.`)
      };

      let message = channel.messages.cache.filter(x => (x.author.id === user.id)).sort((A,B) => B.createdTimestamp - A.createdTimestamp).first();

      let collectionSize = 1;
      let lastMessageId  = channel.messages.cache.sort((A,B) => A.createdTimestamp - B.createdTimestamp).last()?.id;


      while (!message && collectionSize !== 0){
        if (!interaction.deferred) await interaction.deferReply();
        const fetchedMessages = await channel.messages.fetch({ before: lastMessageId });
                      message = fetchedMessages.find(x => x.author.id === user.id);
                lastMessageId = fetchedMessages.sort((A,B) => A.createdTimestamp - B.createdTimestamp).last()?.id;
               collectionSize = fetchedMessages.size;
      };

      if (!message){
        const response = `\\⚠️ No introduction message was found for **\`${user.tag}\`**`;
        return interaction.deferred ? interaction.editReply(response) : interaction.reply(response)
      } else {
        const textResponse = `Here is **${user.tag}**'s Introductory Message~`;
        const embedResponse = new MessageEmbed()
        .setColor([79,84,92])
        .setDescription(message.content || '')
        .setThumbnail(message.author.displayAvatarURL())
        .setImage(message.attachments.find(x => x.height)?.url);

        const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
          .setLabel('Jump to Original Message')
          .setURL(message.url)
          .setStyle('LINK'),
        );

        const response = {
          content: textResponse,
          embeds: [embedResponse],
          components: [row]
        };

        return interaction.deferred ? interaction.editReply(response) : interaction.reply(response);
      };

    } else if (interaction.options.getSubcommand() === 'channel') {
      if (!interaction.member.permissions.has(FLAGS.MANAGE_GUILD)){
        return interaction.reply(`\\❌ You are not allowed to use this command!`);
      };
      const channel = interaction.options.getChannel('target');

      if (!channel.isText()){
        return interaction.reply(`\\❌ The selected channel is not a [**\`Text-based Channel\`**](${hideLinkEmbed('https://discord.js.org/#/docs/main/stable/typedef/TextBasedChannels')})`)
      };

      profile.introduction.channel = channel.id;
      return profile.save()
      .then(() => {
        client.localcache.serverprofiles[interaction.guildId] = profile;
        return interaction.reply(`\\✔️ Introduction channel has been set to ${channel}`);
      })
      .catch(error => {
        return interaction.reply(`\\❌ The Following Error was encountered: ${error.message}`);
      });

    } else if (interaction.options.getSubcommand() === 'disable-channel') {
      if (!interaction.member.permissions.has(FLAGS.MANAGE_GUILD)){
        return interaction.reply(`\\❌ You are not allowed to use this command!`);
      };
      if (profile.introduction.channel === null){
        return interaction.reply(`\\❌ The Introduction Channel is already disabled!`);
      };

      profile.introduction.channel = null;
      return profile.save()
      .then(() => {
        client.localcache.serverprofiles[interaction.guildId] = profile;
        return interaction.reply(`\\✔️ Introduction channel has been disabled!`);
      })
      .catch(error => {
        return interaction.reply(`\\❌ The Following Error was encountered: ${error.message}`);
      });
    };
  }
};
