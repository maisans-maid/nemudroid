'use strict';

const { join } = require('path');
const { readdirSync } = require('fs');
const userModel = require('../models/userSchema.js');
const guildModel = require('../models/guildSchema.js');
const { registerFont, createCanvas, loadImage } = require('canvas');

registerFont(join(
    __dirname,
    '../assets/fonts/MoonTime-Regular.ttf'
), {
    family: 'MoonTime Regular'
});

exports.birthdayGreeter = async function (client) {

    const guildsWithLogChannel = await guildModel.find({
        'birthday.channel': { $type: 'string' }
    }, {
        _id: 1,
        birthday: 1
    });

    if ((guildsWithLogChannel instanceof Error) || !guildsWithLogChannel.length)
        return;

    const usersWithBirthdays = await userModel.find({
        'birthday.day'  : { $eq: new Date().getDate() },
        'birthday.month': { $eq: new Date().getMonth() + 1 }
    }, {
        _id: 1
    });

    if ((usersWithBirthdays instanceof Error) || !usersWithBirthdays.length)
        return;

    for (const guildProfile of guildsWithLogChannel){
        const guild = client.guilds.cache.get(guildProfile._id);
        if (!guild) continue;

        const channel = guild.channels.cache.get(guildProfile.birthday.channel);
        if (!channel) continue;

        if (!channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'ATTACH_FILES']))
            continue;

        const members = await guild.members.fetch({
            user: usersWithBirthdays.map(user => user._id)
        });

        if (!members.size) continue;

        for (const [id, member] of members){
            const background = await loadImage(join(
                __dirname,
                '../assets/images/birthday',
                'png_20211116_222201_0000.png'
            ));
            const avatar = await loadImage(member.user.displayAvatarURL({
                size: 512,
                dynamic: false,
                format: 'jpg'
            }));

            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(background, 0, 0);

            ctx.arc(
                canvas.width / 2,
                390,
                140,
                0,
                Math.PI * 2
            );
            ctx.save();
            ctx.clip();
            ctx.drawImage(
                avatar,
                (canvas.width / 2) - 140,
                390 - 140,
                280,
                280
            );
            ctx.restore();

            ctx.fillStyle = '#FFA938';
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 7;
            ctx.font = 'bold 175px MoonTime Regular';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Happy Birthday!',
                canvas.width / 2,
                550
            );
            ctx.strokeText(
                'Happy Birthday!',
                canvas.width / 2,
                550
            );

            await channel.send({
                content: `🎉🎉 Happy Birthday ${member}!!`,
                files: [{
                    attachment: canvas.toBuffer(),
                    name: 'Nemdroid_birthday_greeting.png'
                }]
            });

            continue;
        };
    };
};
