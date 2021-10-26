const { model, Schema } = require('mongoose');

module.exports = model('user_profiles', Schema({
  _id: String,
  xp: { type: Array, default: []}
}, {
  versionKey: false
}));
