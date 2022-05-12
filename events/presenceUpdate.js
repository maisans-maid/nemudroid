'use strict';

const productionId = '753150492380495894';
const developerId  = '545427431662682112';

module.exports = (client, oldPresence, newPresence) => {
    if (newPresence.userId !== developerId) return;

    const { name, type, url, details } = newPresence.activities.filter(x => x.type !== 'CUSTOM')[0] || {};

    if (name && type){
        return client.user.setActivity(details || name, { type, url });
    } else {
        return client.user.setActivity('Nemuphobia', { type: 'PLAYING' });
    };
};
