'use strict';

const { MessageEmbed } = require('discord.js');
const gModel = require('../models/guildSchema.js');
const uModel = require('../models/userSchema.js');

module.exports = async interaction => {
      await interaction.deferReply({ ephemeral: true });
      if (interaction.fields.getTextInputValue('reset') !== 'RESET') return interaction.editReply({
          content: '❌ Invalid input!'
      });
      const update = await uModel.updateMany({ 'xp.id': interaction.guildId }, {
            $pull: { 'xp' : { id: interaction.guildId }}
      });
      if (!update.acknowledged){
          return interaction.editReply(`❌ Operation was not acknowledged.`);
      };
      if (update.modifiedCount === 0){
          return interaction.editReply(`❌ **${interaction.user.tag}**, this server has no xp data to be cleared of!`);
      };
      const gDocument = await gModel.findByIdOrCreate(interaction.guildId, {
          'channels.logger': 1
      }).catch(e => e);
      if (gDocument instanceof Error){
          return interaction.reply({
              ephemeral: true,
              content: `❌ Error: ${gDocument.message}`
          });
      };
      const channel = interaction.guild.channels.cache.get(gDocument.channels.logger);
      if (channel) await channel.send({ embeds: [
          new MessageEmbed()
          .setColor('ORANGE')
          .setAuthor({
              name: '➰ XP Reset'
          })
          .setThumbnail(interaction.user.displayAvatarURL())
          .setDescription('The XP for this server has been reset!')
          .addField('Executor', interaction.user.tag)
          .setTimestamp()
      ]}).catch(() => {});
      return interaction.editReply(`✔️ **${interaction.user.tag}**, this server's xp has been reset. (Cleared **${update.modifiedCount}** xpdocs)`);
  }
