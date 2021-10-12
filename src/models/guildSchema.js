const { model, Schema } = require('mongoose');

module.exports = model('server_profiles', Schema({
  _id: String,
  prefix: { type: String, default: null },
  introduction: {
    channel: { type: String, default: null }
  },
  greeter: {
    welcome: {
      isEnabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
      message: {
        isEnabled: { type: Boolean, default: false },
        text: { type: String, default: null }
      }
    }
  }
}, {
  versionKey: false
}));