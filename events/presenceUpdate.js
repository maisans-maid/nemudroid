module.exports = (client, oldPresence, newPresence) => {
  // Nemu's id = '753150492380495894'
  // My id     = '545427431662682112'

  if (newPresence.userId !== '753150492380495894')
      return;

  const { name, type, url, details } = newPresence.activities.filter(x => x.type !== 'CUSTOM')[0] || {};

  if (name && type){
      return client.user.setActivity(details || name, { type, url });
  } else {
      return console.log(client.user.setActivity('Nemuphobia', { type: 'PLAYING' }));
  };
};
