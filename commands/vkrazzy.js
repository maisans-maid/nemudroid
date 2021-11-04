const { SlashCommandBuilder, bold, underscore } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const vkrazzyDatabase = require('../assets/json/vkrazzy.json');

const command = new SlashCommandBuilder()
.setName('vkrazzy')
.setDescription('View info on vkrazzy members.')
.addStringOption(option => option
    .setName('member')
    .setDescription('View info on which vkrazzy member?')
    .addChoices([
        [ 'Kamiya Juu', 'Kamiya Juu' ],
        [ 'Hannah', 'Hannah' ],
        [ 'Cymations', 'Cymations' ],
        [ 'Keira Ukagi & Kenyooki', 'Keira Ukagi & Kenyooki' ],
        [ 'Erian Osamu', 'Erian Osamu' ],
        [ 'Yoshida Hazuki', 'Yoshida Hazuki' ],
        [ 'Nemu Kurosagi', 'Nemu Kurosagi' ],
        [ 'Pan the Bread', 'Pan the Bread' ],
        [ 'Teru Bozu', 'Teru Bozu' ]
    ])
    .setRequired(true)
);

const baseUrl = {
  "YouTube"  : "https://www.youtube.com/",
  "Twitter"  : "https://twitter.com/",
  "Instagram": "https://www.instagram.com/",
  "Twitch"   : "https://www.twitch.tv/",
  "Facebook" : "https://www.facebook.com/"
};

const emoji = {
  "YouTube"  : "902592545715011625",
  "Twitter"  : "902592530116407326",
  "Instagram": "902592513276280862",
  "Twitch"   : "902592446649733150",
  "Facebook" : "902592481286320148"
};

module.exports = {
    builder: command,
    execute: async (client, interaction) => {

        const member = interaction.options.getString('member');
        const data = vkrazzyDatabase[member];
        const content = `${underscore(bold(member))} \n\n https://discord.gg/${data.Discord}`;
        const components = [ new MessageActionRow() ];

        function button(name, url){
            return new MessageButton()
                .setLabel(name)
                .setStyle('LINK')
                .setURL(url)
        };

        function addComponent(component){
            if (components[0].components.length >= 5){
                if (!components[1])
                    components.push(new MessageActionRow());
                components[1].addComponents(component);
            } else {
                components[0].addComponents(component);
            };
        };

        for (const [key, value] of Object.entries(data)){
            if (key === 'Discord')
                continue;

            if (Array.isArray(value)){
                for (const _val of value){
                    if (typeof _val === 'object'){
                        addComponent(button(
                            _val.type === 'c/'
                                ? _val.suffix
                                : key
                            ,
                            baseUrl[key] + _val.type + _val.suffix
                        )
                        .setEmoji(emoji[key]));
                    } else {
                        addComponent(button(
                            _val,
                            baseUrl[key] + _val.type + _val.suffix
                        )
                        .setEmoji(emoji[key]));
                    };
                };
            }
            else {
                if (typeof value === 'object'){
                    addComponent(button(
                        value.type === 'c/'
                            ? value.suffix
                            : key
                        ,
                        baseUrl[key] + value.type + value.suffix
                    )
                    .setEmoji(emoji[key]));
                } else {
                    addComponent(button(
                        value.type === 'c/'
                            ? value.suffix
                            : key
                        ,
                        baseUrl[key] + value.type + value.suffix
                    ).setEmoji(emoji[key]));
                };
            };
        };

        const ReplyOptions = { content };

        if (Object.keys(data).filter(x => x !== 'Discord').length)
            ReplyOptions.components = components;

        return interaction.reply(ReplyOptions);
    }
};
