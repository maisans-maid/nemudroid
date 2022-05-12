const { SlashCommandBuilder, bold, underscore } = require('@discordjs/builders');
const { Permissions, MessageActionRow, MessageButton } = require('discord.js');
const { join } = require('path');
const vkrazzyDatabase = require('../assets/json/vkrazzy.json');
const _ = require('lodash');

const command = new SlashCommandBuilder()
.setName('vkrazzy')
.setDescription('View info on vkrazzy members.')
.addStringOption(option => option
    .setName('member')
    .setDescription('View info on which vkrazzy member?')
    .addChoices([
        [ 'Cymations', 'Cymations' ],
        [ 'Erian Osamu', 'Erian Osamu' ],
        [ 'Hannah', 'Hannah' ],
        [ 'Yoshida Hazuki', 'Yoshida Hazuki' ],
        [ 'Kamiya Juu', 'Kamiya Juu' ],
        [ 'Keira Ukagi', 'Keira Ukagi' ],
        [ 'Kenyooki', 'Kenyooki' ],
        [ 'Nemu Kurosagi', 'Nemu Kurosagi' ],
        [ 'Pan the Bread', 'Pan the Bread' ],
        [ 'Teru Bozu', 'Teru Bozu' ],
    ])
    .setRequired(true)
);

const baseUrl = {
  "Discord"  : "https://discord.gg/",
  "YouTube"  : "https://www.youtube.com/",
  "Twitter"  : "https://twitter.com/",
  "Instagram": "https://www.instagram.com/",
  "Twitch"   : "https://www.twitch.tv/",
  "Facebook" : "https://www.facebook.com/",
  "Wiki"     : "https://virtualyoutuber.fandom.com/wiki/"
};

const emoji = {
  "Discord"  : "972113941901742090",
  "YouTube"  : "902592545715011625",
  "Twitter"  : "902592530116407326",
  "Instagram": "902592513276280862",
  "Twitch"   : "902592446649733150",
  "Facebook" : "902592481286320148",
  "Wiki"     : "🌐"
};

const nameplates = {
  Cymations: 'cymations',
  'Erian Osamu': 'eri',
  Hannah: 'hannah-banana',
  'Yoshida Hazuki': 'hazuki',
  'Kamiya Juu': 'kamiya-juu',
  'Keira Ukagi': 'keira-ukagi',
  Kenyooki: 'kenyooki',
  'Nemu Kurosagi': 'nemu',
  'Pan the Bread': 'pan',
  'Teru Bozu': 'teru',
};

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        const member = interaction.options.getString('member');
        const data = vkrazzyDatabase[member];
        const components = [ new MessageActionRow() ];

        function button(name, url){
            return new MessageButton()
                // .setLabel(name)
                .setStyle('LINK')
                .setURL(url)
        };

        function addComponent(component){
            let index = 0

            while (
                components[index] &&
                components[index].components.length >= 5
            )  index++;

            if (index > 4) return;

            if (!(components[index] instanceof MessageActionRow))
                components[index] = new MessageActionRow();

            return components[index].addComponents(component);
        };

        for (const [key, value] of Object.entries(data)){
            for (const _val of _.castArray(value)){
                addComponent(button(
                    typeof _val === 'object'
                        ? _val.type === 'c/'
                            ? _val.suffix
                            : key
                        : key === 'Discord'
                            ? key
                            : _val
                    ,
                    typeof _val === 'object'
                        ? baseUrl[key] + _val.type + _val.suffix
                        : baseUrl[key] + _val
                )
                .setEmoji(emoji[key]));
            };
        };

        const ReplyOptions = { files: [{
            attachment: join(__dirname, '..', 'assets/images/vkrazzy', `namecard-${nameplates[member]}.png`),
            name: 'vkrazzy-nameplate.png'
        }]};

        if (Object.keys(data).length)
            ReplyOptions.components = components;

        return interaction.reply(ReplyOptions);
    }
};
