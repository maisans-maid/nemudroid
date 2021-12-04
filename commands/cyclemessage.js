const { SlashCommandBuilder } = require('@discordjs/builders');
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('cyclemessage')
.setDescription('Cycles messages on set amount of duration')
.addStringOption(option => option
    .setName('message')
    .setDescription('The message to cycle. Leave blank to remove cycled messages on this channel')
)
.addNumberOption(option => option
    .setName('hours')
    .setDescription('The time required per cycle (defaults to 12)')
);

const allowedPermissions = (Guild) => Guild.roles.cache
    .filter(role => role.permissions.has('MANAGE_CHANNELS'))
    .map(role => Object.assign({},{
        id: role.id,
        type: 'ROLE',
        permission: true
    }));

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {
        const message = interaction.options.getString('message') || null;
        const duration = interaction.options.getNumber('hours') || 12;

        if (duration < 1 || duration > 24)
            return interaction.reply({
                content: 'Error: Valid values range from 1 to 24',
                ephemeral: true
            });

        await interaction.deferReply({ ephemeral: true });

        const document = await model.findById(interaction.guildId) || new model({ _id: interaction.guildId });

        if (document instanceof Error)
            return interaction.editReply(`❌ Error: ${document.message}`);

        if (document.cycledMessages.some(x => x.channelId === interaction.channel.id)){
              document.cycledMessages.splice(document.cycledMessages.findIndex(x => x.channelId === interaction.channel.id), 1, message ? {
                  channelId: interaction.channel.id,
                  content: message,
                  duration: duration
              } : undefined);
              document.cycledMessages = document.cycledMessages.filter(Boolean);
        } else {
            if (message){
                document.cycledMessages.push({
                    channelId: interaction.channel.id,
                    content: message,
                    duration: duration
                });
            };
        };

        return document.save()
        .then(async () => {
            const cycledmessages = client.localCache.cycledMessages.get(interaction.guildId)
            const cycledmessage = cycledmessages.get(interaction.channel.id);

            if (cycledmessage)
                clearInterval(cycledmessage);

            const interval = setInterval(function(){
                interaction.channel.send({ content: message })
                .catch(error => interaction.guild.channels.cache.get('907014736544145420').send({
                    embeds: [
                        new MessageEmbed()
                        .setColor('RED')
                        .setAuthor('⚠ MessageCycle Error')
                        .setDescription(error.message)
                    ]
                }))
            }, duration * 36e5);

            if (message)
            await interaction.channel.send({ content: message });

            cycledmessages.set(interaction.channel.id, interval[Symbol.toPrimitive]());
            return interaction.editReply(`Successfully ${message ? 'added' : 'removed'} a cycled message ${message ? 'to' : 'from'} this channel${message ? ` that runs once every ${duration} hour(s)` : ''}.`);
        })
        .catch(err => interaction.editReply(`❌ Error: ${err.message}`));
    }
}
