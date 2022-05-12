'use strict';

const uModel = require('../../models/userSchema.js');
const { MessageEmbed } = require('discord.js');

module.exports = async (gameName, score, interaction) => {

    const projection = {
        captcha: { '_id': 1, 'gameStats.captcha': 1 },
        hangman: { '_id': 1, 'gameStats.hangman': 1 },
        minesweeper: { '_id': 1, 'gameStats.minesweeper': 1 },
        tictactoe: { '_id': 1, 'gameStats.tictactoe': 1 },
    };

    let embeds, embed, rank;
    const rankings = await uModel.find({ 'xp.id': interaction.guildId }, projection[gameName]);

    if (rankings instanceof Error) return;

    const getMaxScore = s => s.length ? Math.max(...s) : 0;
    let top = rankings
        .sort((A, B) => getMaxScore(B.gameStats[gameName].scores) - getMaxScore(A.gameStats[gameName].scores))
        .splice(0,3)
        .map(m => ({
            id: m._id,
            max: getMaxScore(m.gameStats[gameName].scores),
            scores: m.gameStats[gameName].scores
        }));

    for (const [i, player] of top.reverse().entries()){
        if (player.max < score){
            rank = top.length - i;
        };
    };

    top.reverse();

    if (rank && (rank !== top.length) && top[rank - 1].id !== interaction.user.id){
        embed = new MessageEmbed()
            .setTimestamp()
            .setColor([255,247,125])
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/3112/3112946.png')
            .setAuthor({
                name: `${interaction.user.tag} achieved ${ordinalize(rank)} place in ${gameName.toUpperCase()}`
            });
        if (rank === 1){
            embed.setFooter({ text: `New High Score: ${score}`});
        };
        if (top[rank]){
            embed.setDescription(`<@${top[rank - 1].id}> falls one place!`);
        };
    }
    return embed;
};

function ordinalize(n = 0){
    return Number(n)+[,'st','nd','rd'][n/10%10^1&&n%10]||Number(n)+'th';
};
