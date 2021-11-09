const { model, Schema } = require('mongoose');

module.exports = model('userProfile', Schema({
    _id: String,
    wallpaper: {
        type: String,
        default: null
    },
    xp: {
        type: Array,
        default: []
    },
    xpMultipliers: {
        type: Array,
        default: []
    },
    inventory: {
        type: Array,
        default: []
    },
    credits: {
        type: Number,
        default: 0
    },
    daily: {
        highteststreak: {
            type: Number,
            default: 0
        },
        currentstreak: {
            type: Number,
            default: 0
        },
        timestamp: {
            type: Date,
            default: Date.now() - 864e5
        }
    }
}, {
  versionKey: false
}));
