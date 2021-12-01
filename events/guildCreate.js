'use strict';

const { registerCommands } = require('../util/registerCommands.js');

module.exports = (client, guild) => {
    registerCommands(client, guild);
};
