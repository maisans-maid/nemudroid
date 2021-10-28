const { SlashCommandBuilder } = require('@discordjs/builders');
const model = require('../models/userSchema.js');

const command = new SlashCommandBuilder()
.setName('level')
.setDescription('Check your (or someone else\'s) level')
.addUserOption(option => option
  .setName('user')
  .setDescription('View this user\'s level')
);

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const user = interaction.options.getUser('user') || interaction.user;

    let document = await model.findById(user.id);
    if (!document) document = new model({ _id: user.id });
    if (document instanceof Error) return interaction.reply({ content: `An error was encountered: ${document.message}`, ephemeral: true });

    const subdocument = document.xp.find(x => x.id === interaction.guildId) || { xp: 0, level: 1};
    const cap  = (level) => 50 * Math.pow(level, 2) + 250 * level;

    //Calculations
    const content = `Info for **${user.tag}**
    - Level: **${subdocument.level}**
    - XP: **${subdocument.xp - cap(subdocument.level - 1)}/${cap(subdocument.level) - cap(subdocument.level - 1)}**

    - Total XP Earned: **${subdocument.xp}**

    *Rank cards (similar to MEE6) will be available soon! Role rewards are already available - contact Server Moderators to add them. You may view the list of achievable rewards by using command \`/levelrewards view\`*
    `;

    interaction.reply({ content, ephemeral: true });
  }
};
