'use strict';

const deployCommands = require('../utility/Commands.deploy.js');

module.exports = (client, guild) => {
    try {
        await deployCommands(client, guild);
    } catch (err) {
        console.log(err);
    };
};
