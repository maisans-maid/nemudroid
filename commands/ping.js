const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('lodash');

const command = new SlashCommandBuilder()
.setName('ping')
.setDescription('Check NemDroid\'s ping (Websocket Connection)')

const responses = [
    'Pong!',
    'I-It\'s not like I wanted to say pong or anything...',
    'Pong...',
    'Testing, testing, 1, 2, 3!',
    'Anyone there?',
    'Does anyone even use this?',
    'Woo! A secret command!',
    'Ping! ...I mean **pong!**',
    'Hi there!',
    'At your service!',
    'Yes?',
    'Hello!',
    "Konnichiwa~",
    "Ohayoo~",
    "I'm up and running!",
    "Here I am!",
    "Right here!",
    "Hai!",
    "Hey there!",
    "You found me!",
    "Nya!",
    "N-Nya..?",
    "Nyahaha you found me!"
];

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {
        const heartbeat = Date.now() - interaction.createdAt;

        return interaction.reply({
            content: `${responses[_.random(0, responses.length) - 1]} ( 🏓 websocket ${client.ws.ping} ms, ♥️ heartbeat ${heartbeat} ms).`
        });
  }
};
