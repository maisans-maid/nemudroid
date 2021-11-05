const { SlashCommandBuilder, channelMention } = require('@discordjs/builders');
const { Permissions: { FLAGS }, TextChannel } = require('discord.js');
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

        if (!interaction.memberPermissions.has(FLAGS.MANAGE_GUILD))
            return interaction.reply({
                ephemeral: true,
                content: '❌ You are not allowed to use this command!'
            });

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand      = interaction.options.getSubcommand();
        const channel         = interaction.options.getChannel('target_channel');
        const user            = interaction.options.getUser('target_user');

        const timeout = function setTimeout(){
            !interaction.deferred && interaction.replied
                ? interaction.deferReply()
                : null
            ,
            2000
        };

        if (subcommandGroup === 'user'){
          /*
          Make the logic for this command later, for now, let's leave it as a future feature
           */
            return interaction[
                interaction.deferred
                    ? 'editReply'
                    : 'reply'
                ]({
                    ephemeral: true,
                    content: 'This feature is not available yet!'
                })
        };

        if (subcommandGroup === 'channel'){

          const document = await model
                  .findById(interaction.guildId)
                  .catch(err => err) ||
              await new model({ _id: interaction.guildId })
                  .save()
                  .catch(err => err);

          if (document instanceof Error)
              return interaction[
                  interaction.deferred
                      ? 'editReply'
                      : 'reply'
                  ]({
                      ephemeral: true,
                      content: `❌ Error: ${document.message}`
                  });

          let content;

          if (subcommand === 'add'){
              if (document.xpBlacklist.some(id => id === channel.id))
                  return interaction[
                      interaction.deferred
                          ? 'editReply'
                          : 'reply'
                      ]({
                          ephemeral: true,
                          content: `The channel ${channel} is already blacklisted!`
                      });

              if (!channel instanceof TextChannel)
                  return interaction[
                      interaction.deferred
                          ? 'editReply'
                          : 'reply'
                      ]({
                          ephemeral: true,
                          content: 'The selected channel is not a Text-based channel!'
                      });

              document.xpBlacklist.push(channel.id);

              content = `Successfully added ${channel} to xp-blacklisted channels!`;
          };

          if (subcommand === 'remove'){
              if (!document.xpBlacklist.some(id => id === channel.id))
                  return interaction[
                      interaction.deferred
                          ? 'editReply'
                          : 'reply'
                      ]({
                          ephemeral: true,
                          content:  `The channel ${channel} is not blacklisted!`
                      });

              const channelIndex = document.xpBlacklist
                  .findIndex(id => id === channel.id);

              document.xpBlacklist
                  .splice(channelIndex, 1);

              content = `Successfully removed ${channel} from xp-blacklisted channels!`;
          };

          if (subcommand === 'view'){
            const unreadable = interaction.guild.channels.cache
                .filter(channel =>
                    !document.xpBlacklist.includes(channel.id) &&
                    channel instanceof TextChannel &&
                    !channel.permissionsFor(client.user)
                        .has(FLAGS.VIEW_CHANNEL)
                );

            let content = document.xpBlacklist.length
                ? `The following channels are blacklisted:\n\n${
                    new Intl.ListFormat('en-us')
                    .format(
                        document.xpBlacklist
                            .map(id => channelMention(id)
                        )
                    )}`
                : 'There are no xp-blacklisted channels in this server!';

            if (unreadable.size)
                content += `\n\n⚠️ XP could not be processed on the following channels because of missing **View Channel** permissions: ${
                    new Intl.ListFormat('en-US')
                    .format(
                        unreadable.map(x => x.toString())
                    )}`;

            return interaction[
                interaction.deferred
                    ? 'editReply'
                    : 'reply'
                ]({
                    content,
                    ephemeral: true
                });
            };

            return document
            save()
            .then(() => {
                client.localCache.guildSchema.set(
                    interaction.guild.id,
                    model(profile).toJSON()
                );
                return interaction[
                    interaction.deferred
                        ? 'editReply'
                        : 'reply'
                    ]({
                        ephemeral: true,
                        content
                    });
            })
            .catch(error => interaction[
                interaction.deferred
                      ? 'editReply'
                      : 'reply'
                  ]({
                    ephemeral: true,
                    content: `❌ Error: ${error.message}`
                  })
            );
        };
    }
};
