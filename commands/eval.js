'use strict';

const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { Permissions, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { inspect } = require('util');
const fetch = require('node-fetch');

const command = new SlashCommandBuilder()
.setName('eval')
.setDescription('Evaluate arbitrary javascript code. [DEVELOPER USE ONLY / DEBUGGER TOOL]')
.addStringOption(option => option
    .setName('code')
    .setDescription('The code to execute')
    .setRequired(true)
)
.addBooleanOption(option => option
    .setName('show')
    .setDescription('Whether to show the result to everyone. Defaults to false. Longer outputs forces to true.')
);

module.exports = {
    builder: command,
    permissions: new Permissions('SEND_MESSAGES'),
    execute: async (client, interaction) => {

        if (interaction.user.id !== '545427431662682112') return interaction.reply({
            ephemeral: true,
            content: '❌ Command access denied! Ask my developer for access'
        });

        const code = interaction.options.getString('code');
        const ephemeral = !interaction.options.getBoolean('show')
        const embed = new MessageEmbed()
            .addField('📥 Input', codeBlock('js', truncate(clean(code), 1000)));

        try {
            let promise, output, download, type, color;
            let evaled = eval(code);
            let raw = evaled;

            if (evaled instanceof Promise){
                await interaction.deferReply({ ephemeral });
                promise = await evaled.then(res => {
                    return {
                        resolved: true,
                        body: inspect(res, { depth: 0 })
                    };
                }).catch(err => {
                    return {
                        rejected: true,
                        body: inspect(err, { depth: 0 })
                    };
                });
            };

            if (typeof evaled !== 'string'){
                evaled = inspect(evaled, { depth: 0 });
            };
            if (promise){
                output = clean(promise.body);
            } else {
                output = clean(evaled);
            };
            if (promise?.resolved){
                color = 'GREEN';
                type = 'Promise (Resolved)'
            } else if (promise?.rejected){
                color = 'RED';
                type = 'Promise (Rejected)';
            } else {
                color = [255,247,125];
                type = (typeof raw).charAt(0).toUpperCase() + (typeof raw).slice(1)
            };

            const elapsed = Math.abs(Date.now() - interaction.createdTimestamp);
            const row = new MessageActionRow();

            embed.setColor(color)
                .addField('📤 Output', output.length > 100 ? codeBlock('fix', `Exceeded 1000 characters\nCharacter Length: ${output.length}`) : codeBlock('js', output))
                .setFooter({ text: `Type: ${type}\u2000•\u2000 Evaluated in ${(elapsed / 1000).toFixed(2)}s.` });

            if (output.length > 1_000){
                const hastebn = await fetch('https://www.toptal/developers/hastebin/documents', {
                    method: 'POST',
                    body: output,
                    headers: { 'Content-Type': 'text/plain' }
                });
                const { key } = await hastebn.json();
                const button  = new MessageButton()
                    .setLabel('View Output in Hastebin')
                    .setStyle('LINK');

                row.addComponents(button
                    .setURL(`https://www.toptal.com/developers/hastebin/raw/${key}`)
                    .setDisabled(hastebn.status === 200 ? false : true)
                );
            }

            const response = { embeds: [ embed ], ephemeral };
            if (output.length > 1000) response.components = [ row ];
            if (interaction.deferred) return interaction.editReply(response);
            return interaction.reply(response);

        } catch (error) {
            const elapsed = Math.abs(Date.now() - interaction.createdTimestamp);
            embed.setColor('RED')
                .addField('📤 Output', codeBlock('ls', truncate(error.stack.split(process.cwd()).join('Nemdroid:\\'), 1000)))
                .setFooter({ text: `Type: ${error.name}\u2000•\u2000 Evaluated in ${(elapsed / 1000).toFixed(2)}s.` });

            const response = { embeds: [ embed ], ephemeral };
            if (interaction.deferred) return interaction.editReply(response);
            return interaction.reply(response);
        };
    }
};


function clean(str){
    return String(str)
        .replace(
            /`/g,
            `\`${String.fromCharCode(8203)}`
        )
        .replace(
            /@/g,
            `@${String.fromCharCode(8203)}`
        );
};

function truncate(str = '', length = 100, end = '...'){
    return String(str).substring(0, length - end.length) + (str.length > length ? end : '');
};
