const { model, Schema } = require('mongoose');

module.exports = model('discord_polls', Schema({
    _id: String,
    question: {
        type: String,
        default: null,
        validate: {
            validator: str => str.length > 0 && str.length <= 240,
            message: str => `Question exceeded character length limit. Expected 1-240 characters, received ${str.length} characters.`
        }
    },
    choices: {
        type: Map,
        of: Object,
        default: new Map()
    },
    messageId: {
        type: String,
        default: null
    },
    creatorId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
},{
    versionKey: false
}));
