const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const model = require('../models/userSchema.js');

const command = new SlashCommandBuilder()
.setName('gamestats')
.setDescription('View yours or a users\' game stats')
.addUserOption(option => option
    .setName('user')
    .setDescription('The user to check the stats')
);

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: (client, interaction) => model
        .findById(interaction.options.getUser('user')?.id || interaction.user.id)
        .then(data => Promise.resolve([new model(data), interaction.options.getUser('user') || interaction.user]))
        .then(([data, user]) => interaction.reply({
            embeds: [
                new MessageEmbed()
                .setColor([255,247,125])
                .setAuthor(`${user.tag}'s game stats~`, user.displayAvatarURL())
                .addFields(Object.entries(data.gamestats).map(([game, props]) => {
                    const name = game.split('_')
                        .map(x => x[0].toUpperCase() + x.slice(1))
                        .join(' ');

                    let value = '';

                    for (const [key, val] of Object.entries(props)){
                        const title = key.split('_')
                            .map(x => x[0].toUpperCase() + x.slice(1))
                            .join(' ');
                        value += `▸ **${title}**: ${val}\n`;

                        if (key === 'games_lost'){
                            const won  = data.gamestats[game].games_won;
                            const lost = data.gamestats[game].games_lost;
                            const percentage = (((won / (won + lost)) * 100) || 0).toLocaleString('en-us', {
                                maximumFractionDigits: 2
                            });
                            value += `▸ **Win Rate**: ${percentage}%`
                        };
                    }

                    return { name, value };
                }))
            ]
        }))
        .catch(e => interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${e.message}`
        }))
};
