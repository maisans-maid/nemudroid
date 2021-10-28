const { SlashCommandBuilder, roleMention } = require('@discordjs/builders');
const { FLAGS } = require('discord.js').Permissions;
const model = require('../models/guildSchema.js');

const command = new SlashCommandBuilder()
.setName('levelrewards')
.setDescription('Manage Level Rewards in this server')
.addSubcommand(subcommand => subcommand
  .setName('add')
  .setDescription('Add a level reward')
  .addIntegerOption(option => option
    .setName('level')
    .setDescription('The level this reward is added. (Overwrites previously saved reward)')
    .setRequired(true)
  )
  .addRoleOption(option => option
    .setName('role')
    .setDescription('The role to reward')
    .setRequired(true)
  )
)
.addSubcommand(subcommand => subcommand
  .setName('remove')
  .setDescription('Remove a level reward')
  .addIntegerOption(option => option
    .setName('level')
    .setDescription('The level the reward is granted')
    .setRequired(true)
  )
)
.addSubcommand(subcommand => subcommand
  .setName('reset')
  .setDescription('Reset the level rewards for this server.')
)
.addSubcommand(subcommand => subcommand
  .setName('view')
  .setDescription('View all the level rewards for this server.')
);

module.exports = {
  builder: command,
  execute: async (client, interaction) => {

    const subcommand = interaction.options.getSubcommand();
    const level      = interaction.options.getInteger('level');
    const role       = interaction.options.getRole('role');

    if ((subcommand !== 'view') && !interaction.memberPermissions.has(FLAGS.MANAGE_GUILD)){
      return interaction.reply({ content: `You are not allowed to use this command!`, ephemeral: true });
    };

    let document = await model.findById(interaction.guildId);
    if (!document) document = new model({ _id: interaction.guildId });
    if (document instanceof Error) return interaction.reply({ content: `An error was encountered: ${document.message}`, ephemeral: true });

    if (subcommand === 'add'){
      if (!document.rewards.some(x => x.level === level)) document.rewards.push({ level, role });
      const index = document.rewards.findIndex(x => x.level === level);
      document.rewards.splice(index, 1, { level, role: role.id });
      document.rewards.sort((A,B) => A.level - B.level);
      return document.save()
      .then(() => interaction.reply({ content: `Successfully set ${role} as a reward for reaching level **${level}**!` , ephemeral: true }))
      .catch(e => interaction.reply({ content: `An error was encountered: ${e.message}`, ephemeral: true }));
    };

    if (subcommand === 'remove'){
      if (!document.rewards.some(x => x.level === level)) return interaction.reply({ content: `Invalid Level: Level **${level}** has no role rewards!` , ephemeral: true });
      const index   = document.rewards.findIndex(x => x.level === level);
      const [ removed ] = document.rewards.splice(index, 1);
      return document.save()
      .then(() => interaction.reply({ content: `Successfully removed ${roleMention(removed.role)} as a reward for reaching level **${level}**!` , ephemeral: true }))
      .catch(e => interaction.reply({ content: `An error was encountered: ${e.message}`, ephemeral: true }));
    };

    if (subcommand === 'reset'){
      document.rewards = [];
      return document.save()
      .then(() => interaction.reply({ content: `Successfully removed all the rewards!` , ephemeral: true }))
      .catch(e => interaction.reply({ content: `An error was encountered: ${e.message}`, ephemeral: true }));
    };

    if (subcommand === 'view'){
      if (!document.rewards.length) return interaction.reply({ content: 'There are currently no assigned level rewards for this server.' })
      return interaction.reply({ content: `These are the rewards you can get according to your level gain:\n\n${document.rewards.map(x => `Level **${x.level}** - ${roleMention(x.role)}`).join('\n')}`});
    };
  }
};
