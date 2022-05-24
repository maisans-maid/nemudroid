'use strict';

const { MessageEmbed } = require('discord.js');
let emojis = [
    '',
    '<:1:960505432709935125>',
    '<:2:960505432777035776>',
    '<:3:960505432709931009>',
    '<:4:960505432496042065>',
    '<:5:960505432827375626>',
    '<:6:960505432965791824>',
    '<:7:960505433049686057>',
    '<:8:960505432714129419>',
    '<:9:960505432873521152>',
    '<:10:960505432718327868>'
];

module.exports = class PollEmbed extends MessageEmbed{
    constructor(author, pDocument, options = {}){
        super();

        this.setColor(options.color || [255,247,125]);

        this.setTitle(pDocument.question);

        this.setAuthor({
            name: author.username,
            iconURL: author.displayAvatarURL()
        });

        this.addFields(pDocument.options.map(option => {
            return {
                name: `[${option.id}] ${option.topic}`,
                value: this.createProgressBar(option, pDocument.totalVotes())
            };
        }))

        this.setTimestamp(pDocument.createdAt);

        this.setFooter({
            text: `${pDocument.totalUniqueVotes()} people have voted.`
        });
    };

    createProgressBar(option, total, e){
        if (Array.isArray(e) && e.length === emojis.length) emojis = e;

        const percentage = Math.floor(option.voters.length * 100 / total) || 0;
        const tens = Math.floor(percentage / 10);
        const remainder = (percentage % 10)|| 0;

        return `${emojis[10].repeat(tens)}${emojis[remainder]} *(${percentage}%)*`;
    };
};
