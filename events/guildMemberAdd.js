const model = require('../models/guildSchema.js');
const WelcomeMessage = require('../Structures/WelcomeMessage.js');
const { TextChannel } = require('discord.js');

module.exports = async (client, member) => {
    let profile = client.localCache.guildSchema
            .get(member.guild.id) ||
        await model
            .findById(member.guild.id)
            .catch(error => error) ||
        await new Model({ _id: member.guild.id })
            .save();

    if (profile instanceof Error)
        return;

    client.localCache.guildSchema.set(
        member.guild.id,
        new model(profile).toJSON()
    );

    const channel = member.guild.channels.cache
        .get(profile.greeter.welcome.channel);

    if (!(channel instanceof TextChannel))
        return;

    try {
        await new WelcomeMessage(member, profile, channel)
            .generateImage();
    } catch (e) {
        console.log(e)
    };
};
