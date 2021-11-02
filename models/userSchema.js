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
    }
}, {
  versionKey: false
}));
