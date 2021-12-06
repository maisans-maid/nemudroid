const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const _ = require('lodash');
const model = require('../models/pollSchema.js');

const command = new SlashCommandBuilder()
.setName('poll')
.setDescription('Generate poll')
.addStringOption(option => option
    .setName('question')
    .setDescription('The question for this poll (Max 256 characters)')
    .setRequired(true)
)
.addStringOption(option => option
    .setName('option-1')
    .setDescription('Selectable option for this poll')
    .setRequired(true)
)
.addStringOption(option => option
    .setName('option-2')
    .setDescription('Selectable option for this poll')
    .setRequired(true)
)
.addStringOption(option => option
    .setName('option-3')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-4')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-5')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-6')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-7')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-8')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-9')
    .setDescription('Selectable option for this poll')
)
.addStringOption(option => option
    .setName('option-10')
    .setDescription('Selectable option for this poll')
);

const allowedPermissions = (Guild) => [{
    id: Guild.roles.everyone.id,
    type: 'ROLE',
    permission: true
}];

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        const choices = new Map();
        const question = interaction.options.getString('question');
        const emojis = ['🟢','🟠','🟡','🔴','🟤','🔵','🟣','⚪','⚫','🔘'];
        const buttons = [];
        const pollCreationTimestamp = Date.now();
        const pollId = pollCreationTimestamp.toString()

        try {
            let index = 0;
            for (const num of [1,2,3,4,5,6,7,8,9,10]){
                const option = interaction.options.getString(`option-${num}`);
                if (!option) continue;

                if (option.length > 256)
                    throw new Error(`Option-${num} length exceeded the 256 character limit.`);

                choices.set(parseInt(index) + 1, {
                    name: option,
                    userIds: []
                });

                buttons.push(new MessageButton()
                    .setCustomId(`POLL:${pollId}:${parseInt(index) + 1}`)
                    .setEmoji(emojis[index])
                    .setStyle('SECONDARY')
                );
                index++;
            };
        } catch (e) {
            return interaction.reply({
                ephemeral: true,
                content: `❌ Error: ${e.message}`
            });
        };

        await interaction.deferReply({ ephemeral: true });

        const document = new model({
            _id: pollId,
            question: question,
            choices: Object.fromEntries(choices),
            creatorId: interaction.user.id,
            createdAt: pollCreationTimestamp
        });

        const components = [ ..._.chunk(buttons, 5).map(row => new MessageActionRow()
                .addComponents(row)
            ),
            new MessageActionRow().addComponents(
                new MessageButton()
                .setCustomId(`POLL:${pollId}:COLLECT`)
                .setLabel('Collect results and end this Poll')
                .setStyle('SUCCESS')
            )
        ];

        const embed = new MessageEmbed()
        .setAuthor(`Poll | ${question}`)
        .setDescription(`*by: <@${document.creatorId}>*`)
        .setColor([255,247,125])
        .setFooter('Select from one of the choices below')
        .addFields([...choices.values()].map((choice, index) => Object.assign({}, {
            name: `${emojis[index]} - ${choice.name}`,
            value: '0 vote(s)'
        })));

        return interaction.channel.send({ embeds: [ embed ], components})
            .then(message => {
                document.messageId = message.id
                return document.save()
            })
            .then(document => interaction.editReply('🎉 Poll successfully created!'))
            .catch(error => interaction.editReply(`❌ Error: ${error.message}`));
    }
};
