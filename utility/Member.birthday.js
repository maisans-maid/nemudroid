'use strict';

const { join } = require('path');
const { readdirSync } = require('fs');
const uModel = require('../models/userSchema.js');
const gModel = require('../models/guildSchema.js');
const { createCanvas, loadImage } = require('node-canvas');

 module.exports = async client => {

     const guildsWithLogChannel = await gModel.find({ 'channels.birthday': { $type: 'string' }}, { _id: 1, 'channels.birthday': 1 });
     if (guildsWithLogChannel instanceof Error){
         return console.log(`BIRTHDAY_GREETER: Fetching guilds -> ${guildsWithLogChannel.message}`);
     };
     if (!guildsWithLogChannel.length){
         return console.log('BIRTHDAY_GREETER: No guilds with logging channel found');
     };

     const usersWithBirthdays = await uModel.find({
         'birthday.day'   : { $eq: new Date().getDate() },
         'birthday.month' : { $eq: new Date().getMonth() + 1 }
     }, { _id: 1 });
     if (usersWithBirthdays instanceof Error){
         return console.log(`BIRTHDAY_GREETER: Fetching users -> ${usersWithBirthdays.message}`)
     };
     if (!usersWithBirthdays.length){
         return console.log('BIRTHDAY_GREETER: No birthday celebrants for today');
     };

     for (const gProfile of guildsWithLogChannel){
         const guild = client.guilds.cache.get(gProfile._id);
         if (!guild) continue;

         const channel = guild.channels.cache.get(gProfile.channels.birthday);
         if (!channel) continue;
         if (!channel.permissionsFor(client.user).has(['SEND_MESSAGES', 'ATTACH_FILES'])) continue;

         const members = await guild.members.fetch({
             user: usersWithBirthdays.map(user => user._id)
         });

         if (!members.size) continue;

         for (const [id, member] of members){
             const background = await loadImage(join(__dirname, '..', 'assets', 'images', 'birthday', 'png_20211116_222201_0000.png'));
             const avatar = await loadImage(member.user.displayAvatarURL({ size: 512, dynamic: false, format: 'jpg' }));
             const canvas = createCanvas(background.width, background.height);
             const ctx = canvas.getContext('2d');

             ctx.drawImage(background,0,0);
             ctx.arc(canvas.width / 2, 390, 140, 0, Math.PI * 2);
             ctx.save();
             ctx.clip();
             ctx.drawImage(avatar, (canvas.width / 2) - 140, 390 - 140, 280, 280);
             ctx.restore();

             ctx.fillStyle = '#FFA938';
             ctx.strokeStyle = ctx.fillStyle;
             ctx.lineWidth = 7;
             ctx.font = 'bold 175px MoonTime Regular';
             ctx.textAlign = 'center';

             ctx.fillText('Happy Birthday!', canvas.width / 2, 550);
             ctx.strokeText('Happy Birthday!', canvas.width / 2, 550);

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
 }
