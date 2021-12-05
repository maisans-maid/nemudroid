'use strict';

const { registerCommands } = require('../util/registerCommands.js');
const { setCommandPermissions } = require('../util/setCommandPermissions.js');

module.exports = (client, guild) => {
    registerCommands(client, guild);
    setCommandPermissions(client);
};
