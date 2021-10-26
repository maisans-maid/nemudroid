const model  = require('../models/userSchema.js');
const _model = require('../models/guildSchema.js');
const _ = require('lodash');

class Experience {
  constructor(model, member){
    this.model = model;
    this.member = member;
    this.index = this.model.xp.findIndex(x => x.id === member.guild.id);
    if (!this.model.xp[this.index]){
      this.model.xp.push({ xp: 0, id: member.guild.id, level: 1 });
      this.index = this.model.xp.findIndex(x => x.id === member.guild.id);
    };
    this.data  = this.model.xp[this.index];
  };
  cap(){
    return 50 * Math.pow(this.data.level, 2) + 250 * this.data.level;
  };
  next(){
    return this.cap() - this.data.xp;
  };
  add(amount){
    this.data.xp += amount;
    while (this.next() < 1) this.incrementLevel();
    return this;
  };
  async incrementLevel(){
    this.data.level++;

    const { rewards } = await _model.findById(this.member.guild.id) || {};

    if (!rewards) return;

    const roles = [...Array(this.data.level + 1).keys()].slice(1)
    .map(level => this.member.guild.roles.cache.get(rewards.find(x => x.level === level)?.role))
    .filter(role => !!role);

    if (roles.length){
      this.member.roles.add(roles).catch(console.error)
    };
  };
  save(){
    this.model.xp.splice(this.index, 1, this.data);
    return this.model.save();
  };
};

module.exports = async (client, message) => {
  if (message.author.bot) return;

  // XP FEAT
  const timestamp = client.localCache.talkingUsers.get(message.author.id) || 0;
  if (timestamp + 6e4 < Date.now()) {
    let document = await model.findById(message.author.id);
    if (!document) document = new model({ _id: message.author.id });
    if (document instanceof Error) return console.log(document.message);

    return new Experience(document, message.member)
    .add(_.random(/*MIN*/20, /*MAX*/30))
    .save()
    .then(() => client.localCache.talkingUsers.set(message.author.id, Date.now()));
  };
  return;
};
