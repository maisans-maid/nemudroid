const { model, Schema } = require('mongoose');

const DEFAULTS = [
    {
        author: { name: '1. THE DISCORD TOS SUMMARY' },
        description: 'As per the Discord ToS Summary, they expect you to:\n(i) be of 13 years of age or more (and the minimum digital consent in your country). Check your country\'s age of consent [here](https://worldpopulationreview.com/country-rankings/age-of-consent-by-country).\n(ii) not use the service (discord) to abuse, oppress, defraud, or discriminate other users.\n(iii) hold responsibility on your account, account credentials, and all of your account activities.\n(iv) agree in receiving communications from discord and any other users.\n(v) adhere to [Intellectual Property Rights](https://www.wipo.int/about-ip/en/).\n(vi) be liable in your content and accept repercussions brought by violating Discord ToS through your content.\n(vii) adhere to their rules of conduct.\n\nYou can read the whole Discord Terms of Service [here](https://discord.com/terms).'
    },
    {
        author: { name: '2. DISCLOSURE OF PRIVATE INFORMATION' },
        description: 'Private information from any of the members from this server shall not be disclosed. Private information shall refer to any identifying documents containing the person\'s Real Name, Contact Details, Real-Life Image, and many others, and other classified documents such as Government and Medical Forms, among many others. Any form of Doxing (search for and publish private or identifying information about <a particular individual> on the internet, typically with malicious intent) is not tolerable. You hereby accept that violation of this rule will automatically warrant a permanent ban. Moderators may also inform affiliated servers about your behavior and may ban you in those servers as well.'
    },
    {
        author: { name: '3. USER DISPUTES' },
        description: 'Discord Terms of Service states that the company disclaims any liability to any user disputes in their service. Any disputes among members should not be expressed nor resolved in this server. Do not bring dramas from other servers here. If the dispute is between a moderator and a member, the involved parties should resolve their dispute on their own. However, disputes brought about by any form of disrespect that includes but is not limited to harassment, trolling, witch hunting, sexism, racism, or hate speech that occurred in this server will not be tolerated and will be dealt with accordingly.'
    },
    {
        author: { name: '4. LANGUAGE AND MESSAGING ETTIQUETTE' },
        description: 'You may speak English and Tagalog on the general messaging channel. Other channels specific to a dialect/language may also be created (If you speak other language, hit the admins with a DM to create a channel). Always read channel descriptions (if there is any) to be aware on any channel-specific rules (such as image-only channels, etc.). General messaging rule is no spamming is allowed, unless the channel-description specified otherwise. Use of inappropriate language (excessive swears, racial slurs, deliberate attempts to instigate negative reactions, etc.) and sending of harmful materials (viruses, pornographic images/links, links to Discord servers that involve the aforementioned, etc.) will be removed and the User(s) in question will be given a written warning, kicked or banned depending on severity.'
    },
    {
        author: { name: '5. SCAMS AND OTHER FRAUDULENT BEHAVIORS' },
        description: 'While we know that scammed users may lost control over their account and may send inappropriate links on any of the text-channel, the user will still be held accountable. To reduce the risk of getting scammed, please enable **2FA** on your device and do not click links that promise to give you any Freebies (i.e. free Discord Nitro). When logging in discord from a browser, always check the address bar if the domain says https://discord.com/ (not d1scord.com or any other similar looking domain). On the other hand, any form of cheating is considered fraudulent, therefore topics that encourage cheating or sending links or files to software that does cheating is not permitted.'
    },
    {
        author: { name: '6. NSFW (Not Safe For Work) RELATED CONTENT' },
        description: 'Any NSFW content is not allowed in this server. NSFW content may refer but is not limited to materials that show anything related to any form of nudity, intense sexuality, political incorrectness, profanity, violence, and/or excessive gore. **Materials** may refer to images, videos, audio files, links to webpages, or simply text-messages that may suggest one. Sending or streaming (on a VC) these kinds of materials (as per rule #4) will warrant a moderative action. Memes adhering to this kind of humor will not be allowed as well.'
    },
    {
        author: { name: '7. ADVERTISING' },
        description: 'Advertising is allowed on this server as long as it is within reasonable grounds (i.e. advertised server or content adheres to the rules mentioned above, especially rule #6). **Do not advertise on any channels**. Please look for a channel designated for advertisement to keep the channel clean.'
    },
    {
        author: { name: '8. MEMBER ENGAGEMENT' },
        description: 'Always follow the contest and giveaway rules. As a member on this server, you are encouraged to engage in these activities and have fun. Feedbacks from users are always appreciated and they should be submitted on a designated channel.'
    },
    {
        author: { name: '9. QUESTIONS' },
        description: 'If you have any questions regarding the rules (If there are parts you did not understand, or there is anything you need to know that isn\'t included in this set of rules), or anything regarding this server, do not hesitate to DM/Message the mods.'
    },
    {
        author: { name: '10. TL;DR (Too Long; Didn\'t Read)' },
        description: 'If reading all of this takes too much of your time, you just need to follow the following:\n- Your behavior in the server must adhere to the [Discord ToS](https://discord.com/terms)\n- You must respect everyone in the server (no discrimination against each other, no doxxing)\n- You deserve to be respected in this server (report any form of discrimination against you to the mod)\n- You must not send any harmful materials in this server (NSFW, SCAM Links, etc.)\n- You must follow the mod\'s recommendation to you (In case you were warned because of a violation of the rules.)\n- If you have any questions, just ask the mods.'
    }
]

module.exports = model('server_rule', Schema({
    _id: String,
    data: {
        content: {
            type: String,
            default: 'This list is not necessarily comprehensive. Whether something is fit for this server is a decision made by the admins. If an admin or mod tells you to stop doing something, listen to them.',
            validate: {
                validator: (text) => text === null ? true : text.length <= 2000,
                message: (text) => `Character length exceeded 2000 characters => (${text.length} characters). `
            }
        },
        embeds: {
            type: Array,
            default: DEFAULTS,
            validate: {
                validator: (embeds) => embeds.reduce((acc, embed) => acc + embed.author.name.length + embed.description.length ,0) <= 6000,
                message: (embeds) => `The sum of all characters from all embed structures in a message exceeded 6000 characters.`
            }
        },
        verify: {
            button: {
                customId: {
                    type: String,
                    default: 'VERIFY:MEMBER'
                },
                label: {
                    type: String,
                    default: 'I accept these rules, Verify me!',
                    validate: {
                        validator: (text) => text.length <= 80,
                        message: (text) => `Button label exceeded 80 characters => (${text.length} characters).`
                    }
                },
                emoji: {
                    type: String,
                    default: '🎉',
                },
                style: {
                    type: String,
                    default: 'SUCCESS',
                    enum: {
                        values: [ 'PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER' ],
                        message: '{VALUE} is not supported!'
                    }
                }
            },
            role: {
                type: String,
                default: null
            }
        }
    }
},{
    versionKey: false
}));
