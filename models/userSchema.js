'use strict';

const { model, Schema } = require('mongoose');
const NemusBizzareAdventure = require('./nemusBASchema.js');

const UserSchema = new Schema({
    _id: String,
    xp: [{
        _id: false,
        id: String,
        xp: { type: Number, default: 0, min: [0, 'Base XP cannot be less than 0'] },
        level: {type: Number, default: 1}
    }],
    birthday: {
        isRestricted: { type: Boolean, default: false },
        day: { type: Number, min: [1, 'Invalid day'], max: [31, 'Invalid day']},
        month: { type: Number, min: [1, 'Invalid Month'], max: [12, 'Invalid Month']}
    },
    gameStats: {
        // Score versioning
        // 1 => scores are stored in the array as is
        // 2 => scores are stored as 1 (win) and 0 (lose)
        captcha: {
            color: { default: '#FCB941', type: String },
            scoreVersion: { default: 1, type: Number },
            scores: { _id: false, type: [Number], default: []}
        },
        coinFlip: {
            color: { default: '#59A9C2', type: String },
            scoreVersion: { default: 2, type: Number },
            scores: { _id: false, type: [Number], default: []}
        },
        hangman: {
            color: { default: '#2CC990', type: String },
            scoreVersion: { default: 1, type: Number },
            scores: { _id: false, type: [Number], default: []}
        },
        minesweeper: {
            color: { default: '#FF6766', type: String },
            scoreVersion: { default: 1, type: Number },
            scores: { _id: false, type: [Number], default: []}
        },
        rps: {
            color: { default: '#FEC606', type: String },
            scoreVersion: { default: 2, type: Number },
            scores: { _id: false, type: [Number], default: []}
        },
        tictactoe: {
            color: { default: '#97CE68', type: String },
            scoreVersion: { default: 2, type: Number },
            scores: { _id: false, type: [Number], default: []}
        }
    },
    //Legacy
    gamestats: {
        captcha: {
            games_played: { type: Number, default: 0 },
            high_score: { type: Number, default: 0 }
        },
        coin_flip: {
            games_won: { type: Number, default: 0 },
            games_lost: { type: Number, default: 0 }
        },
        hangman: {
            games_won: { type: Number, default: 0 },
            games_lost: { type: Number, default: 0 }
        },
        minesweeper: {
            games_played: { type: Number, default: 0 },
            high_score: { type: Number, default: 0 }
        },
        rps: {
            games_won: { type: Number, default: 0 },
            games_lost: { type: Number, default: 0 }
        },
    },
    nemusBizzareAdventure: {type: NemusBizzareAdventure, default: () => ({})},
    wallpaper: { type: String, default: null, validate: {
        validator: str => str !== null ? /png|jpg|jpeg/.test(str.split('.').pop()) : true,
        message: () => 'Unable to parse media from url. Please make sure the url leads to a png, jpg, or jpeg file.'
    }},
}, {
    versionKey: false
});

UserSchema.statics.findByIdOrCreate = async function findByIdOrCreate(id) {
    let d = await this.findById(id);
    if (d == null || !d) d = new this({ _id: id });
    return d;
};

UserSchema.statics.getXPLeaderboard = async function getXPLeaderboard(guildId){
    if (!guildId) return null;
    const c = await this.find({ 'xp.id': guildId }, { 'xp.$': 1, '_id' : 1 });
    const s = x => { return { id: x._id, xp: x.xp[0].xp, level: x.xp[0].level }};

    return c.map(s).sort((A,B) => B.xp - A.xp);
};

UserSchema.methods.getXP = function getXP(guildId){
    return this.xp.find(x => x.id === guildId) || { xp: 0, level: 1, id: guildId };
};

UserSchema.methods.getXPCap = function getXPCap(guildId, level){
    const data = this.getXP(guildId);
    return 50 * Math.pow(level ? level : data.level, 2) + 250 * (level ? level : data.level);
};

UserSchema.methods.getXPNext = function getXPNext(guildId){
    const data = this.getXP(guildId);
    return this.getXPCap(guildId) - data.xp;
};

UserSchema.methods.addXP = function addXP(guildId, amount){
    if (typeof amount !== 'number') return null;
    let index = this.xp.findIndex(x => x.id === guildId);
    if (index < 0){
        this.xp.push({ xp: 0, level: 1, id: guildId });
        index = this.xp.findIndex(x => x.id === guildId);
    };
    const data = this.xp.splice(index, 1)[0];
    const result = { before: { id: data.id, xp: data.xp, level: data.level }};

    data.xp += Math.round(amount);
    data.level = 1;
    while ((this.getXPCap(guildId, data.level) - data.xp) < 1){
        data.level++;
    };

    this.xp.push(data);
    result.after = { id: data.id, xp: data.xp, level: data.level };
    return result;
};

UserSchema.methods.getGameData = function getGameData(){
    const data = {};
    for (const [name, prop] of Object.entries(this.gameStats)){
        data[name] = {
            name,
            color: prop.color,
            played: prop.scores.length,
            won:  prop.scoreVersion == 1 ? null : prop.scores.map(n => Boolean(n)).filter(Boolean).length,
            lost: prop.scoreVersion == 1 ? null : prop.scores.map(n => !Boolean(n)).filter(Boolean).length,
            bestScore: prop.scoreVersion == 2 ? null : prop.scores.length ? Math.max(...prop.scores) : 0,
            meanScore: prop.scoreVersion == 2 ? null : (prop.scores.reduce((a,b) => a + b, 0) / prop.scores.length) || 0,
            winRate: prop.scoreVersion == 1 ? null : (prop.scores.filter(n => Boolean(n)).length / prop.scores.length) || 0
        };
    };
    return data;
};

module.exports = model('userProfile', UserSchema);
