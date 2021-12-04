const {
    Permissions: {
        FLAGS
    },
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js');

const { SlashCommandBuilder, hideLinkEmbed } = require('@discordjs/builders');
const model = require('../models/guildSchema.js');

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

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const subcommand = interaction.options.getSubcommand();

        if ((subcommand !== 'user') &&
            !interaction.member.permissions.has(FLAGS.MANAGE_GUILD)
        )  return interaction.reply({
                ephemeral: true,
                content: '❌ You are not allowed to use this command!'
            });

        let profile = client.localCache.guildSchema
                .get(interaction.guildId) ||
            await model
                .findById(interaction.guildId)
                .catch(error => error) ||
            await new model({ _id: interaction.guildId })
                .save();

        if (profile instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${profile.message}`
            });

        client.localCache.guildSchema.set(
            interaction.guildId,
            model(profile).toJSON()
        );

        if (subcommand === 'user'){
            const user = interaction.options.getUser('target');
            const channel = interaction.guild.channels.cache
                .get(profile.introduction.channel);

            if (profile.introduction.channel === null)
                return interaction.reply({
                    ephemeral: true,
                    content:   '⚠️ Channel for fetching introduction message not set. Please have the server managers set the channel first!'
                });

            if (!channel)
                return interaction.reply({
                    ephemeral: true,
                    content:   '❌ Channel for fetching introduction message could not be found. Channel may have been deleted.'
                });

            let message = channel.messages.cache
                .filter(x => x.author.id === user.id)
                .sort((A, B) => B.createdTimestamp - A.createdTimestamp)
                .first();

            let lastMessageId = channel.messages.cache
                .sort((A, B) => A.createdTimestamp - B.createdTimestamp)
                .last()?.id;

            let collectionSize = 1;

            while(!message && collectionSize !== 0){
                if (!interaction.deferred)
                    await interaction.deferReply();

                const fetched = await channel.messages
                    .fetch({
                        before: lastMessageId
                    })
                    .catch(error => error);

                if (fetched instanceof Error)
                    return interaction[
                        interaction.deferred
                        ? 'editReply'
                        : 'reply'
                    ]({
                        ephemeral: true,
                        content: `❌ Error: ${fetched.message}`
                    });

                lastMessageId = fetched
                    .sort((A, B) => A.createdTimestamp - B.createdTimestamp)
                    .last()?.id;

                message = fetched.find(x => x.author.id === user.id);
                collectionSize = fetched.size;
            };

            if (!message)
                return interaction[
                    interaction.deferred
                    ? 'editReply'
                    : 'reply'
                ]({
                    ephemeral: true,
                    content: `⚠️ No introduction message was found for **\`${user.tag}\`**`
                })

            return interaction[
                interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
                content: `Here is **${user.tag}**'s Introductory Message~`,
                components: [
                    new MessageActionRow()
                    .addComponents(new MessageButton()
                        .setLabel('Jump to OP (Original Post)')
                        .setURL(message.url)
                        .setStyle('LINK')
                    )
                ],
                embeds: [
                    new MessageEmbed()
                    .setColor([79, 84, 92])
                    .setDescription(message.content.substr(0,2000) || '')
                    .setThumbnail(message.author.displayAvatarURL())
                    .setImage(message.attachments.find(x => x.height)?.url)
                ]
            });
        };

        if (!(profile instanceof model))
            profile = await model
                .findById(interaction.guildId)
                .catch(error => error);

        if (profile instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${profile.message}`
            });

        if (subcommand === 'channel'){
            const channel = interaction.options.getChannel('target');

            if (!channel.isText())
                return interaction.reply({
                    ephemeral: true,
                    content: `❌ The selected channel is not a [**\`Text-based Channel\`**](${hideLinkEmbed('https://discord.js.org/#/docs/main/stable/typedef/TextBasedChannels')})`
                });

            profile.introduction.channel = channel.id;
            return profile.save()
            .then(() => {
                client.localCache.guildSchema.set(
                    interaction.guildId,
                    model(profile).toJSON()
                );
                return interaction.reply({
                    ephemeral: true,
                    content: `✔️ Introduction channel has been set to ${channel}`
                });
            })
            .catch(error => interaction
                .reply({
                    ephemeral: true,
                    content:   `❌ Error: ${error.message}`
                })
            )
        };

        if (subcommand === 'disable-channel'){
            if (profile.introduction.channel === null)
                return interaction.reply({
                    ephemeral: true,
                    content:   '❌ The Introduction Channel is already disabled!'
                });

            profile.introduction.channel = null;
            return profile.save()
                .then(() => {
                    client.localCache.guildSchema.set(
                        interaction.guildId,
                        model(profile).toJSON()
                    );
                    return interaction.reply({
                        ephemeral: true,
                        content: '✔️ Introduction channel has been disabled!'
                    });
                })
                .catch(error => interaction
                    .reply({
                        ephemeral: true,
                        content:  `❌ Error: ${error.message}`
                    })
                );
        };
    }
};
