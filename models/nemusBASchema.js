'use strict';

const { Schema } = require('mongoose');
const NemusBizzareAdventure = new Schema({
    _id: false,
    totalDiceConsumed: { type: Number, min: 0, default: 0 },
    totalLevels: { type: Number, min: 0, default: 0 },
    livesTimestamp: { type: Date, default: Date.now() }
}, { versionKey: false });

NemusBizzareAdventure.methods.getBasicInfo = function getBasicInfo(){
    return {
        towerLevel: Math.ceil((this.totalLevels + 1) / 20),
        floorTile: this.totalLevels % 20,
    };
};

NemusBizzareAdventure.methods.consumeDice = function consumeDice(result){
    if (this.diceOwned() < 1) throw new Error('No lives left');
    if (this.livesTimestamp < Date.now()) this.livesTimestamp = new Date(Date.now());
    this.totalDiceConsumed++;
    this.totalLevels += result;
    this.livesTimestamp = new Date(this.livesTimestamp.getTime() + (30 * 60_000));
    return this;
};

NemusBizzareAdventure.methods.diceOwned = function diceOwned(){
    if (this.livesTimestamp < Date.now()) this.livesTimestamp = new Date(Date.now());
    const consumedLives = Math.ceil((this.livesTimestamp - Date.now()) / (30 * 60_000));
    return 5 - consumedLives;
};

NemusBizzareAdventure.methods.nextDiceIn = function nextDiceIn(){
    if (this.livesTimestamp < Date.now()) return 0;
    return (this.livesTimestamp - Date.now()) % (30 * 60000);
};


module.exports = NemusBizzareAdventure;
