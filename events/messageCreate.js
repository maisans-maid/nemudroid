const { calculateXPFromMessage } = require('../Structures/EXPCalc.js');

module.exports = async (client, message) => {
  if (message.author.bot) return;

  // EXPFEAT
  const { errors } = await calculateXPFromMessage(client, message);

  if (errors.length)
      console.log(errors);
};
