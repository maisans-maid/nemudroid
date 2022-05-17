const { model, Schema } = require('mongoose');

const PollSchema = new Schema({
    _id: String,
    guildId: { type: String, default: null },
    channelId: { type: String, default: null },
    messageId: { type: String, default: null },
    authorId: { type: String, default: null },
    // isPublic => allows anyone to add a choice
    isPublic: { type: Boolean, default: false },
    // allowMultiple => allows users to cast multiple votes
    allowMultiple: { type: Boolean, default: false },
    question: { type: String, default: null },
    options: [{ _id: false, id: Number, topic: String, voters: [String]}]
}, {
    versionKey: false
});

PollSchema.methods.from = function from(interaction){
    this._id = Date.now().toString();
    this.guildId = interaction.guildId;
    this.channelId = interaction.channelId;
    this.messageId = null;
    this.authorId = interaction.member.id;
    this.question = interaction.fields.getTextInputValue('question');
    return this;
};

PollSchema.methods.addChoice = function addChoice(choice){
    this.options.push({
        id: this.options.length + 1,
        topic: choice,
        voters: []
    });
    return this;
};

PollSchema.methods.addVote = function addVote(optionId, voterId){
    if (this.allowMultiple !== true){
        while(this.hasVoted(voterId)){
            const index = this.options.findIndex(choice => choice.voters.includes(voterId));
            const [ data ] = this.options.splice(index, 1);
            data.voters.splice(data.voters.indexOf(voterId));
            this.options.push(data);
        };
    };
    const [ subdocument ] = this.options.splice(this.options.findIndex(option => option.id == optionId), 1);
    subdocument.voters.push(voterId);
    subdocument.voters = [ ...new Set(subdocument.voters) ];
    this.options.push(subdocument);
    this.options.sort((A,B) => A.id - B.id);
    return this;
};

PollSchema.methods.hasVoted = function hasVoted(voterId){
    return this.options.some(choice => choice.voters.includes(voterId));
};

PollSchema.methods.totalVotes = function totalVotes(){
    return [...this.options.map(x => x.voters)].flat().length;
};

PollSchema.methods.totalUniqueVotes = function totalUniqueVotes(){
    return [...new Set([...this.options.map(x => x.voters)].flat())].length
};

PollSchema.methods.sortByVotes = function sortByVotes(type){
    if (type === 'descending'){
        this.options.sort((A,B) => A.voters.length - B.voters.length);
    } else {
        this.options.sort((A,B) => B.voters.length - A.voters.length);
    };
    return this;
};

module.exports = model('pollDocumentv2', PollSchema);
