const model = require('../models/userSchema.js');

exports.birthdayGreeter = async function (client) {
    const channelId = '874162814518956033'
    const channel = client.guilds.cache
        .filter(guild => guild.channels.cache.has(channelId))
        .first()?.channels.cache.get(channelId);

    if (!channel)
        return;

    const userProfiles = await model.find({});

    if (userProfiles instanceof Error)
        return;

    if (!userProfiles.length)
        return;

    const birthdayProfiles = userProfiles
        .filter(x =>
            (x.birthday.day === new Date().getDate()) &&
            (x.birthday.month === new Date().getMonth() + 1)
        );

    for (const profile of birthdayProfiles){
        channel.send(`Happy birthday <@${profile._id}>!!! More birthdays to come!`);
    }

};
