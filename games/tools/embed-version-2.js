'use strict';

const uModel = require('../../models/userSchema.js');
const { MessageEmbed } = require('discord.js');

module.exports = async (gameName, score, interaction, uDocument) => {

    const projection = {
        coinFlip: { '_id': 1, 'gameStats.coinFlip': 1 },
        rps: { '_id': 1, 'gameStats.rps': 1 }
    };

    let embeds, embed, rank;
    const rankings = await uModel.find({ 'xp.id': interaction.guildId }, projection[gameName]);

    if (rankings instanceof Error) return;

    const getWinRate = s => s.length ? s.reduce((a,b) => a + b, 0) / s.length : 0;
    let top = rankings
        .sort((A, B) => getWinRate(B.gameStats[gameName].scores) - getWinRate(A.gameStats[gameName].scores))
        .splice(0,3)
        .map(m => ({
            id: m._id,
            winRate: getWinRate(m.gameStats[gameName].scores),
            scores: m.gameStats[gameName].scores
        }));

    for (const [i, player] of top.reverse().entries()){
        if (player.winRate < getWinRate([...uDocument.gameStats[gameName].scores, score])){
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
            embed.setFooter({ text: `New High Score: ${getWinRate([...uDocument.gameStats[gameName].scores, score])} % Win Rate`});
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
