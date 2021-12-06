const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { CategoryChannel, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('enablesupport')
.setDescription('Sets the support system for this server')
.addChannelOption(option => option
    .setName('category-channel')
    .setDescription('The category channel this support system belongs to')
    .setRequired(true)
)

const allowedPermissions = (Guild) => Guild.roles.cache
    .filter(role => role.permissions.has('MANAGE_GUILD'))
    .map(role => Object.assign({},{
        id: role.id,
        type: 'ROLE',
        permission: true
    }));

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const channel = interaction.options.getChannel('category-channel');

        if (!(channel instanceof CategoryChannel))
            return interaction.reply({
                ephemeral: true,
                content: 'The selected channel is not a category channel!',
                embeds: [ new MessageEmbed().setColor([255,247,125]).setImage('https://cdn.discordapp.com/attachments/902363353677185095/917007108707336212/Animation.gif')]
            });

        await interaction.deferReply({ ephemeral: true });

        const document = await model.findById(interaction.guildId) || new model({ _id: interaction.guildId });

        if (document instanceof Error){
            return interaction.editReply(`❌ Error: ${document.message}`);
        };

        document.supportsys.categoryChannelId = channel.id;

        const mainchannel = await channel.createChannel('supportsys', {
            permissionOverwrites: channel.permissionOverwrites.cache
        }).catch(error => error);

        if (mainchannel instanceof Error){
            return interaction.editReply(`❌ Error: ${mainchannel.message}`);
        };

        const embeds = generateEmbed(interaction, document);

        const components = [
            new MessageActionRow().addComponents(
                new MessageButton()
                .setCustomId('TICKETSYS-CREATE')
                .setLabel('Create a Ticket!')
                .setEmoji('📩')
                .setStyle('SECONDARY')
            )
        ];

        const message = await mainchannel.send({ embeds, components })
            .catch(err => err);

        if (message instanceof Error){
            return interaction.editReply(`❌ Error: ${message.message}`);
        };

        document.supportsys.mainTextChannelId = mainchannel.id;

        return document.save()
        .then(() => {
            client.localCache.guildSchema.set(interaction.guildId, document.toJSON())
            return interaction.editReply(`Support system was configured and bound to **${channel.name}**`)
        })
        .catch(err => interaction.editReply(`❌ Error: ${err.message}`));
    }
};

function generateEmbed(interaction, document){
  return [
      new MessageEmbed()
      .setColor([255,247,125])
      .setAuthor(`${interaction.guild.name} Support`)
      .setDescription('If you wish to report something or need assistance, please open up a ticket below!')
      .setFooter('Don\'t create a ticket without reason or to troll or because you were curious what it does. You\'ll receive a warning.')
      .addField(
          '__Only contact us through tickets for__',
          document.supportsys.supportreasons.map(x => `• ${x}`).join('\n')
      ),

      new MessageEmbed()
      .setColor([255,247,125])
      .addField(
          '__After opening a ticket:__',
          [
            '• You will be redirected to a newly created channel just for you and the staff',
            '• Be patient for them to assist you while your situation is being handled',
            '• Be professional about your report'
          ].join('\n')
      )
      .addField(
          '\u200b',
          'Make sure what you\'re reporting is relevant to the list above.'
      )
      .setFooter('To open a ticket, click on the button below!')
  ];
};
