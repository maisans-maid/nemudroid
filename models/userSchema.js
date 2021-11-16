const { model, Schema } = require('mongoose');

module.exports = model('userProfile', Schema({
    _id: String,
    birthday: {
        isRestricted: {
            type: Boolean,
            default: false
        },
        day: {
            type: Number,
            min: [
                1,
                'Invalid day'
            ],
            max: [
                31,
                'Invalid day'
            ]
        },
        month: {
            type: 'Number',
            min: [
                1,
                'Invalid Month'
            ],
            max: [
                12,
                'Invalid Month'
            ]
        }
    },
    notifications: {
        levelup: {
            type: Boolean,
            default: false
        }
    },
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
    },
    gamestats: {
        captcha: {
            games_played: {
                type: Number,
                default: 0
            },
            high_score: {
                type: Number,
                default: 0
            }
        },
        coin_flip: {
            games_won: {
                type: Number,
                default: 0
            },
            games_lost: {
                type: Number,
                default: 0
            }
        },
        hangman: {
            games_won: {
                type: Number,
                default: 0
            },
            games_lost: {
                type: Number,
                default: 0
            }
        },
        minesweeper: {
            games_played: {
                type: Number,
                default: 0
            },
            high_score: {
                type: Number,
                default: 0
            }
        },
        rps: {
            games_won: {
                type: Number,
                default: 0
            },
            games_lost: {
                type: Number,
                default: 0
            }
        }
    }
}, {
  versionKey: false
}));
