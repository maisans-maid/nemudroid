const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { Permissions: { FLAGS }, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fetch = require('node-fetch');
const { inspect } = require('util');

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
)

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    if (interaction.member.id !== '545427431662682112'){
      return interaction.reply({ content: `You are not allowed to use this command! Contact my developer if you wish to have access.`, ephemeral: true });
    };

    const code      = interaction.options.getString('code')
    const ephemeral = !interaction.options.getBoolean('show')

    try {
      let promise, output, download, type, color;
      let evaled = eval(code);
      let raw    = evaled;

      if (evaled instanceof Promise) {
        await interaction.deferReply();
        promise = await evaled
        .then(res => { return { resolved: true, body: inspect(res, { depth: 0 })};})
        .catch(err => { return { rejected: true, body: inspect(err, { depth: 0 })};});
      };
      if (typeof evaled !== 'string'){
        evaled = inspect(evaled, { depth: 0 });
      };
      if (promise) {
        output = clean(promise.body)
      } else {
        output = clean(evaled)
      };
      if (promise?.resolved){
        color = 'GREEN'
        type = 'Promise (Resolved)'
      } else if (promise?.rejected){
        color = 'RED'
        type = 'Promise (Rejected)'
      } else {
        color = 0xe620a4
        type = (typeof raw).charAt(0).toUpperCase() + (typeof raw).slice(1)
      };

      const elapsed = Math.abs(Date.now() - interaction.createdTimestamp);
      const row     = new MessageActionRow();
      const embed   = new MessageEmbed().setColor(color)
      .addField('\\📥 Input' , codeBlock('js', truncate(clean(code),1000)))
      .addField('\\📤 Output', output.length > 1000 ? codeBlock('fix', `Exceeded 1000 characters\nCharacter Length: ${output.length}`) : codeBlock('js', output))
      .setFooter(`Type: ${type}\u2000•\u2000 Evaluated in ${(elapsed / 1000).toFixed(2)}s.`);

      if (output.length > 1000){
        const headers = { 'Content-Type': 'text/plain' };
        const options = { method: 'POST', body: output, headers };
        const hastebn = await fetch('https://hastebin.com/documents', options)
        const button  = new MessageButton()
        .setLabel('View Output in Hastebin')
        .setStyle('LINK');

        if (hastebn.status === 200){
          const { key } = await hastebn.json();
          row.addComponents(button.setURL(`https://hastebin.com/${key}.js`))
        } else {
          row.addComponents(button.setURL('https://discord.com/channels/@me').setDisabled(true))
        };
      };

      const response = { embeds: [ embed ], ephemeral };

      if (output.length > 1000){
        response['components'] = [ row ];
      };

      return interaction.deferred ? interaction.editReply(response) : interaction.reply(response);

    } catch (e){
      return interaction.deferred ? interaction.editReply({content: e.message, ephemeral}) : interaction.reply({content: e.message, ephemeral})
    };
  }
};


function clean(str){
  return String(str).replace(/`/g, `\`${String.fromCharCode(8203)}`).replace(/@/g, `@${String.fromCharCode(8203)}`);
};

function truncate(str = '', length = 100, end = '...'){
  return String(str).substring(0, length - end.length) + (str.length > length ? end : '');
};
