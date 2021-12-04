const { SlashCommandBuilder, bold, underscore } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const vkrazzyDatabase = require('../assets/json/vkrazzy.json');
const _ = require('lodash');

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

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
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
            if (key === 'Discord')
                continue;

            for (const _val of _.castArray(value)){
                addComponent(button(
                    typeof _val === 'object'
                        ? _val.type === 'c/'
                            ? _val.suffix
                            : key
                        : _val
                    ,
                    typeof _val === 'object'
                        ? baseUrl[key] + _val.type + _val.suffix
                        : baseUrl[key]
                )
                .setEmoji(emoji[key]));
            };
        };

        const ReplyOptions = { content };

        if (Object.keys(data).filter(x => x !== 'Discord').length)
            ReplyOptions.components = components;

        return interaction.reply(ReplyOptions);
    }
};
