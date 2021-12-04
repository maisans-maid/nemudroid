const { model, Schema } = require('mongoose');

module.exports = model('server_profiles', Schema({
    _id: String,
    prefix: {
        type: String,
        default: null
    },
    nemunnouncement: {
        channel: {
            type: String,
            default: null
        },
        role: {
            type: String,
            default: null
        }
    },
    cycledMessages: {
        type: Array,
        default: []
    },
    rewards: {
        type: Array,
        default: []
    },
    xpBlacklist: {
        type: Array,
        default: []
    },
    introduction: {
        channel: {
            type: String,
            default: null
        }
    },
    birthday: {
        channel: {
            type: String,
            default: null
        }
    },
    greeter: {
        welcome: {
            isEnabled: {
                type: Boolean,
                default: false
            },
            channel: {
                type: String,
                default: null
            },
            message: {
                isEnabled: {
                    type: Boolean,
                    default: false
                },
                text: {
                    type: String,
                    default: null
                }
            }
        }
    }
}, {
  versionKey: false
}));
