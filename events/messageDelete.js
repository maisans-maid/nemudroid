'use strict';

const logger = require('../utility/Audits.messageDelete.js');

module.exports = async (client, message) => {

    if (message.author?.bot) return;
    logger(message);

    
};
