const {
    MessageEmbed,
    MessageAttachment,
    MessageActionRow,
    MessageButton
} = require('discord.js');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage } = require('canvas');
const model = require('../models/userSchema.js');
const fetch = require('node-fetch');

const command = new SlashCommandBuilder()
.setName('leaderboard')
.setDescription('Display this server\'s leaderboard');

module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        const collection = await model.find({
            'xp.id': interaction.guildId
        },{
            'xp.$': 1,
            '_id' : 1
        });

        if (collection instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${collection.message}`
            });

        if (!collection.length)
            return interaction.reply({
                ephemeral: true,
                content:  '⚠️ This server has no leaderboard yet. Start chatting to gain XP!'
            });

        const timeout = setTimeout(() =>
            !interaction.replied
                ? interaction.deferReply()
                : null,
            2500
        );

        function ordinalize(n = 0){
          return Number(n)+[,'st','nd','rd'][n/10%10^1&&n%10]||Number(n)+'th';
        };

        function splitNumber(number){
          return Number(number || '').toLocaleString('en-US', { maximumFractionDigits: 0 });
        };

        function cap(level){
            return 50 * Math.pow(level, 2) + 250 * level;
        };

        const colors = [
            [212,175,55],
            [192,192,192],
            [205,127,50]
        ];

        const fetched = await interaction.guild.members
            .fetch({ user: collection.map(x => x._id )})
            .catch(error => error);

        if (fetched instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${fetched.message}`
            });

        const mappableCollection = collection
            .filter(x => fetched.has(x._id))
            .sort((A,B) => B.xp[0].xp - A.xp[0].xp)
            .splice(0,10);

        const files = [], components = [];

        for (const [index, data] of Object.entries(mappableCollection)){
            const canvas = createCanvas(600,100);
            const ctx = canvas.getContext('2d');
            const xp_current = data.xp[0].xp - cap(data.xp[0].level - 1);
            const xp_limit   = cap(data.xp[0].level) - cap(data.xp[0].level - 1);
            const xp_percent = xp_current / xp_limit;
            const avatar = await loadImage(fetched.get(data._id).user.displayAvatarURL({ format: 'png', size: 256 }));
            const primaryColor   = ['rgb(212,175,55)','rgb(192,192,192)','rgb(205,127,50)'][index] || '#A9A9A9';
            const secondaryColor = 'rgb(54,54,54)';
            const header1 = 'bold 35px Minecraftia';
            const header2 = 'bold 25px Minecraftia';
            const header3 = '15px Minecraftia';

          function placeText(text, x, y){
              ctx.beginPath();
              ctx.moveTo(x - ctx.measureText(text).width / 2, y);
              ctx.lineTo(x + ctx.measureText(text).width / 2, y);
              ctx.lineWidth = 18;
              ctx.lineCap = 'round';
              ctx.strokeStyle = primaryColor;
              ctx.stroke();
              ctx.fillStyle = secondaryColor;
              ctx.textAlign = 'center';
              ctx.fillText(text, x, y + 16);
          };

          function placeVerticalLine(x, y, height, color = primaryColor){
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + height);
              ctx.lineCap = 'square';
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.stroke();
          };

          function generateXPBar(x, y, width, percent){
              ctx.lineCap = 'butt';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.arcTo(x, y - 6, x + 6, y - 6, 6);
              ctx.lineTo(x + width - 6, y - 6);
              ctx.arcTo(x + width, y - 6, x + width, y, 6);
              ctx.arcTo(x + width, y + 6, x + width - 6, y + 6, 6);
              ctx.lineTo(x + 6, y + 6);
              ctx.arcTo(x, y + 6, x, y, 6);
              ctx.stroke();
              ctx.save();
              ctx.clip();
              ctx.moveTo(x, y);
              ctx.lineTo(x + (width * xp_percent), y);
              ctx.lineWidth = 6;
              ctx.stroke();
              ctx.restore();
          };

          function generateXPDialogue(x, y, xp, cap){
              ctx.font        = '10px Minecraftia';
              const { actualBoundingBoxAscent, actualBoundingBoxDescent, width } = ctx.measureText(cap);

              ctx.strokeStyle = primaryColor;
              ctx.fillStyle   = primaryColor;

              ctx.beginPath();
              ctx.moveTo(x + 4, y - (actualBoundingBoxAscent + 4));
              ctx.lineTo(x - (width + 16), y - (actualBoundingBoxAscent + 4));
              ctx.lineTo(x - (width + 16), y + (actualBoundingBoxDescent + 4));
              ctx.lineTo(x, y + (actualBoundingBoxDescent + 4));
              ctx.stroke();

              ctx.textAlign = 'right';
              ctx.fillText(xp, x - 8, y);

              ctx.beginPath();
              ctx.moveTo(x + 4, y - (actualBoundingBoxAscent + 4));
              ctx.lineTo(x + (width + 16), y - (actualBoundingBoxAscent + 4));
              ctx.lineTo(x + (width + 16), y + (actualBoundingBoxDescent + 4));
              ctx.lineTo(x - 4, y + (actualBoundingBoxDescent + 4));
              ctx.stroke();
              ctx.fill();

              ctx.textAlign = 'left';
              ctx.fillStyle = secondaryColor;
              ctx.fillText(cap, x + 8, y)
              ctx.stroke();
          };

          ctx.arc(80,50,40,0,Math.PI * 2);
          ctx.lineWidth = 10;
          ctx.strokeStyle = primaryColor;
          ctx.stroke();
          ctx.save();
          ctx.clip();
          ctx.drawImage(avatar,40,10,80,80);
          ctx.restore();

          ctx.beginPath();
          ctx.textAlign = 'center';
          ctx.font = header1;
          ctx.fillStyle = primaryColor;
          ctx.fillText(ordinalize(Number(index) + 1), 220, 72);
          ctx.font = header3;
          placeText('RANKED', 220, 70);
          placeVerticalLine(280, 20, 60);

          ctx.beginPath();
          ctx.moveTo();

          generateXPBar(300, 28, 160, xp_percent);
          generateXPDialogue(380, 53, splitNumber(xp_current), splitNumber(xp_limit))
          ctx.font = header3;
          placeText('EXP', 380, 70);
          placeVerticalLine(480, 20, 60);

          ctx.beginPath();
          ctx.font = header1;
          ctx.textAlign = 'center'
          ctx.fillStyle = primaryColor;
          ctx.fillText(data.xp[0].level, 540, 72);
          ctx.font = header3
          placeText('LEVEL', 540, 70);

          files.push(new MessageAttachment(
              canvas.toBuffer(),
              `lb-${data._id}.png`
          ));
        };

        const fullList = collection
            .filter(x => fetched.has(x._id))
            .sort((A,B) => B.xp[0].xp - A.xp[0].xp)
            .map((x,i) => {
                return `#${i+1} - ${fetched.get(x._id).user.tag} - LEVEL: ${x.xp[0].level} - TOTAL_EXP: ${x.xp[0].xp}`;
            });

        if (fullList.length > 10){
            const hastebn = await fetch('https://www.toptal.com/developers/hastebin/documents', {
                method: 'POST',
                body: `${interaction.guild.name} Leaderboard:\n\n${fullList.join('\n')}`,
                headers: { 'Content-Type': 'text/plain' }
            });
          const { key } = await hastebn.json();
          components.push(new MessageActionRow().addComponents(new MessageButton()
          .setLabel('View all list in plain text')
          .setStyle('LINK')
          .setURL(`https://www.toptal.com/developers/hastebin/raw/${key}`)
          .setDisabled(hastebn.status !== 200 ? true : false)));
        };

        return interaction[
            interaction.deferred
                ? 'editReply'
                : 'reply'
            ]({
              files,
              components,
              embeds: mappableCollection.map((data, index) =>
                  new MessageEmbed()
                  .setAuthor(fetched.get(data._id).user.tag)
                  .setColor(colors[index] || 'GREY')
                  .setImage(`attachment://lb-${data._id}.png`)
              )
        });
    }
};
