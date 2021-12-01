const { calculateXPFromMessage } = require('../Structures/EXPCalc.js');
const { linkFilter } = require('../util/linkFilter.js');
const { nemunnouncement } = require('../util/nemunnouncement.js');

module.exports = async (client, message) => {

  // If guild is not nemu's do not execute.
  if (message.guild.id !== '874162813977919488')
      return;

  if (message.author.bot) return;

  // EXPFEAT
  const { errors } = await calculateXPFromMessage(client, message);

  if (errors.length)
      console.log(errors);

  // FILTERS
  linkFilter(message);

  // Announcements
  nemunnouncement(message);
};
