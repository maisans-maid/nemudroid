'use strict';

const { MessageEmbed, Permissions: { FLAGS }} = require('discord.js');


// Deletes messages with invite links from users except for mods
exports.linkFilter = function (message) {

    if (message.member.permissions.has(FLAGS.MANAGE_GUILD))
        return;

    const server = /https?\:\/\/discord(\.gg|\.com\/invite)\/[\w\d]{2,32}/;
    const bot = /https?\:\/\/discord.com\/api\/oauth2\/authorize\?/;

    const logChannels = {
      dev: '906996830338965574',
      prod: '907014736544145420'
    };

    let channel;

    for (const logChannel of Object
        .values(logChannels)
        .map(id => message.guild.channels.cache.get(id))
        .filter(Boolean)
    )
        channel = logChannel;

    if (!channel) return;

    const embed = new MessageEmbed().setTimestamp();

    const errors = {
      'Missing Permissions': 'Missing **Manage Messages** Permissions.'
    };

    if (
        server.test(message.content) ||
        bot.test(message.content)
    )
        return message
          .delete()
          .then(() => channel.send({
              embeds: [
                  embed
                  .setColor('ORANGE')
                  .setAuthor('⚠️ Unwanted Link Detected!')
                  .setThumbnail(message.author.displayAvatarURL())
                  .addFields([
                      {
                          name: 'Message Author',
                          value: message.author.tag
                      },
                      {
                          name: 'Type',
                          value: server.test(message.content)
                              ? 'Server Invite Link'
                              : 'Bot Invite Link'
                          ,
                          inline: true
                      },
                      {
                          name: 'Origin',
                          value: message.channel.toString(),
                          inline: true
                      },
                      {
                          name: 'Original Message',
                          value: message.content.substr(0,1024)
                      },
                  ])
              ]
          }))
          .catch(error => channel.send({
              embeds: [
                  embed
                  .setColor('RED')
                  .setAuthor('❌ LinkFilter Error')
                  .setDescription(`Message filter detected a [${server.test(message.content) ? 'Server Invite Link' : 'Bot Invite Link'}](${message.url}) on ${message.channel} but was not deleted due to ${error.name} -> ${errors[error.message] || error.message}`)
              ]
          }));

    return
};
