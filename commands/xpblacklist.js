const { SlashCommandBuilder, channelMention } = require('@discordjs/builders');
const { FLAGS } = require('discord.js').Permissions;
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('xpblacklist')
.setDescription('Manage XP blacklist for this server.')
.addSubcommandGroup(group => group
  .setName('channel')
  .setDescription('Manage XP blacklist for channels on this server.')
  .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Add a channel on the xp blacklist.')
    .addChannelOption(option => option
      .setName('target_channel')
      .setDescription('The channel to add on the xp blacklist.')
      .setRequired(true)
    )
  )
  .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a channel from the xp blacklist')
    .addChannelOption(option => option
      .setName('target_channel')
      .setDescription('The channel to remove on the xp blacklist.')
      .setRequired(true)
    )
  )
  .addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('Display the list of blacklisted channels')
  )
)
.addSubcommandGroup(group => group
  .setName('user')
  .setDescription('Manage XP blacklist for users on this server.')
  .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Add a user on the xp blacklist.')
    .addUserOption(option => option
      .setName('target_user')
      .setDescription('The user to add on the xp blacklist')
      .setRequired(true)
    )
  )
  .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a user from the xp blacklist')
    .addUserOption(option => option
      .setName('target_user')
      .setDescription('The user to remove on the xp blacklist')
      .setRequired(true)
    )
  )
);

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand      = interaction.options.getSubcommand();
    const channel         = interaction.options.getChannel('target_channel');
    const user            = interaction.options.getUser('target_user');

    setTimeout(() => !interaction.deferred && !interaction.replied ? interaction.deferReply() : null, 2000);

    if (!interaction.memberPermissions.has(FLAGS.MANAGE_GUILD)){
      return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `You are not allowed to use this command!`, ephemeral: true });
    };

    if (subcommandGroup === 'user'){
      /*
      Make the logic for this command later, for now, let's leave it as a future feature
       */
      return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: 'This feature is not available yet!', ephemeral: true });
    };

    if (subcommandGroup === 'channel'){

      const document = await model.findById(interaction.guildId);
      if (!document) await new model({ _id: interaction.guildId }).save();
      if (document instanceof Error) document = client.localCache.guildSchema.get(interaction.guildId);
      if (!document) return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: 'Error: Could not connect to database.', ephemeral: true });

      if (subcommand === 'add'){
        if(document.xpBlacklist.some(id => id === channel.id))
            return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `The channel ${channel} is already blacklisted!`, ephemeral: true });
        if (!channel.isText())
            return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `The selected channel is not a Text-based channel!`, ephemeral: true });

        document.xpBlacklist.push(channel.id);
        return document.save()
        .then(() => {
          client.localCache.guildSchema.set(interaction.guildId, document);
          return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `Successfully added ${channel} to xp-blacklisted channels!`, ephemeral: true })
        })
        .catch(e => interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `Error: ${e.message}`, ephemeral: true }));
      } else if (subcommand === 'remove'){

        if (!document.xpBlacklist.some(id => id === channel.id))
            return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `The channel ${channel} is not blacklisted!`, ephemeral: true });

        document.xpBlacklist.splice(document.xpBlacklist.findIndex(id => id === channel.id), 1);
        return document.save()
        .then(() => {
          client.localCache.guildSchema.set(interaction.guildId, document);
          return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `Successfully removed ${channel} from xp-blacklisted channels!`, ephemeral: true });
        })
        .catch(e => interaction[interaction.deferred ? 'deferReply' : 'reply']({ content: `Error: ${e.message}`, ephemeral: true }));
      } else {
        const content = document.xpBlacklist.length ? `The following channels are blacklisted: ${new Intl.ListFormat('en-us').format(document.xpBlacklist.map(id => channelMention(id)))}` : 'There are no xp-blacklisted channels in this server!';
        return interaction[interaction.deferred ? 'deferReply' : 'reply']({ content, ephemeral: true });
      };
    };
  }
};
