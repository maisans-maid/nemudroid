const { model, Schema } = require('mongoose');

module.exports = model('userProfile', Schema({
  _id: String,
  wallpaper: {type: String, default: null },
  xp: { type: Array, default: []}
}, {
  versionKey: false
}));
