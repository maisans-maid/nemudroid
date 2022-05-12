'use strict';

const logger = require('../utility/Audits.guildMemberRemove.js');

module.exports = async (client, member) => {
    logger(member);
};
