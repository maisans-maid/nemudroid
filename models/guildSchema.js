const { model, Schema } = require('mongoose');

const GuildSchema = new Schema({
    _id: String,
    afks: {
        type: [String],
        default: []
    },
    channels: {
        clearMessages: {
            type: String,
            default: null
        },
        birthday: {
            type: String,
            default: null
        },
        gameBroadcast: {
            type: String,
            default: null
        },
        introduction: {
            type: String,
            default: null
        },
        levelUp: {
            type: String,
            default: null
        },
        logger: {
            type: String,
            default: null
        },
        supportCategoryId: {
            type: String,
            default: null
        },
        supportTextId: {
            type: String,
            default: null
        },
        supportTranscriptId: {
            type: String,
            default: null
        },
        supportCategoryChildren: {
            type: [String],
            default: []
        },
        verification: {
            type: String,
            default: null
        },
        welcome: {
            type: String,
            default: null
        },
        xpBlacklist: {
            type: [String],
            default: []
        },
    },
    roles: {
        verification: {
            type: String,
            default: null
        },
        rewards: {
            type: [{ _id: false, level: String, role: String }],
            default: []
        }
    },
    text: {
        welcome: {
            type: String,
            default: null
        },
        rules: {
            type: [{ title: String, description: String, iconURL: String, _id: false }],
            default: [],
            validate: {
                validator: array => array.length <= 10,
                message: () => `You can only store up to 10 rules`
            },
        },
        supportReasons: {
            type: [String],
            default: [
                'Filing any complaints',
                'Punishment/penalty appeals'
            ],
            validate: {
                // make sure the reasons does fall under the 1000 embed value char limit
                validator: array => array.reduce((acc, cur) => acc + 4 + cur.length, 0) < 1000,
                message: () => `Max character (1000) exceeded for the reasons. Please remove other reason or make sure that all the reasons is within the 1000 character limit.`
            }
        }
    }
}, {
    versionKey: false
});

GuildSchema.statics.findByIdOrCreate = async function findByIdOrCreate(id) {
    let document = await this.findById(id);
    if (document == null || !document){
        document = new this({ _id: id });
    };
    return document;
};

module.exports = model('guildProfile', GuildSchema);
