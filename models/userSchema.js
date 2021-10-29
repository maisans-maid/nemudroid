const { model, Schema } = require('mongoose');

module.exports = model('user_profiles', Schema({
  _id: String,
  wallpaper: {type: String, default: null },
  xp: { type: Array, default: []}
}, {
  versionKey: false
}));
