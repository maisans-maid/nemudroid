const { SlashCommandBuilder } = require('@discordjs/builders');
const { FLAGS } = require('discord.js').Permissions;
const model = require('../models/userSchema.js');
const _model = require('../models/guildSchema.js');
const { loadImage } = require('canvas');

const command = new SlashCommandBuilder()
.setName('xpmanage')
.setDescription('Manage Various XP features for this server')
.addSubcommand(group => group
    .setName('add')
    .setDescription('Add XP points to a user.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to receive the added points')
        .setRequired(true)
    )
    .addIntegerOption(option => option
        .setName('value')
        .setDescription('The amount of XP to give')
        .setRequired(true)
    )
)
.addSubcommand(group => group
    .setName('reset')
    .setDescription('Reset the xp points of a specific user')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user you want to have their xp reset')
        .setRequired(true)
    )
)
.addSubcommand(subcommand => subcommand
    .setName('wallpaper')
    .setDescription('Forcibly change the wallpaper of the user on their rank cards')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user you want to change the wallpaper')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('url')
        .setDescription('The URL of the image to use. Leave blank for none (remove bg)')
    )
)

const allowedPermissions = (Guild) => Guild.roles.cache
    .filter(role => role.permissions.has('MANAGE_GUILD'))
    .map(role => Object.assign({},{
        id: role.id,
        type: 'ROLE',
        permission: true
    }));

module.exports = {
  builder: command,
  permissions: allowedPermissions,
  execute: async (client, interaction) => {

        const user = interaction.options.getUser('user');

        if (user.bot){
            return interaction.reply({
                ephemeral: true,
                content:   'Bots are unmanageable! (They cannot earn XP)'
            });
        };

        const subcommand = interaction.options.getSubcommand();
        const value      = interaction.options.getInteger('value');
        const url        = interaction.options.getString('url');
        const document   = await model.findById(user.id).catch(e => e);
        let subdocument;

        if (!document)
            await new model({ _id: user.id })
                .save()
                .catch(e => e);

        if (document instanceof Error)
            return interaction.reply({
                ephemeral: true,
                content:   `Error: ${document.message}`
            });

        if(document.xp.some(x => x.id === interaction.guildId))
            [ subdocument ] = document.xp.splice(
                  document.xp.findIndex(x => x.id === interaction.guildId),
                  1
            );

        if (!subdocument)
            subdocument = { level: 0, xp: 0, id: interaction.guildId };

        if (subcommand === 'add'){
            if (value < 0){
                return interaction.reply({
                    ephemeral: true,
                    content:   'XP cannot be subtracted from a user (as their level is stored independently with the XP). You can reset their xp instead.'
                });
            };

            function cap(level){
                return 50 * Math.pow(level, 2) + 250 * level;
            };

            function next(level, xp){
              return cap(level) - xp;
            };

            subdocument.xp += value;
            while (next(subdocument.level, subdocument.xp) < 1)
                subdocument.level ++;

            let _document = await _model.findById(interaction.guildId);

            if (!_document)
                _document = await new _model({ _id: interaction.guildId })
                    .save()
                    .catch(e => e);

            if (_document instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content:   `Error: ${_document.message}`
                });

            document.xp.push(subdocument);
            const data = await document.save().catch(e => e);

            if (data instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content:   `Error: ${data.message}`
                });

            const { rewards } = _document;

            const roles = [...Array(subdocument.level + 1).keys()]
                .slice(1)
                .map(level => interaction.guild.roles.cache.get(
                    rewards.find(x => x.level === level)?.role
                ))
                .filter(Boolean);

            const member = await interaction.guild.members
                .fetch(user.id)
                .catch(e =>  e);

            if (member instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content:   `Error: ${member.message}`
                });

            if (roles.length)
                await member.roles.add(roles).catch(console.error)

            return interaction.reply({
                ephemeral: true,
                content:   `Successfully added ${value} XP to ${user}!`
            });
         };

        if (subcommand === 'reset'){
            document.xp.push({ level: 0, xp: 0, id: interaction.guildId });

            const data = await document.save().catch(e => e);

            if (data instanceof Error)
                return interaction.reply({
                    ephemeral: true,
                    content:   `Error: ${data.message}`
                });

            return interaction.reply({
                ephemeral: true,
                content:   `Successfully reset ${user}'s XP!`
            });
        };

        if (subcommand === 'wallpaper'){
            if (url){
                if (!/https?:\/\/i.imgur.com\/[a-z0-9]*(\.(png|jpg))?/gi.test(url))
                    return interaction.reply({
                        ephemeral: true,
                        content  : 'Invalid URL! URL must be an imgur image link (<https://i.imgur.com/>...).'
                    });

                await interaction.deferReply();

                let imageData = await loadImage(url).catch(e => e)

                if (imageData instanceof Error)
                    return interaction.editReply({
                        ephemeral: true,
                        content:   `Error: ${imageData.message}`
                    });

                if (imageData.height > 228 || imageData.width > 512)
                    return interaction.editReply({
                        ephemeral: true,
                        content:   'Image is too large! Max size is 512x228 px. Recommended size is 315x140 px. If you really want to use this image, you can easily edit it in less than a minute by following [this guide.](<https://gist.github.com/maisans-maid/9313cf686ccd3a5b670fb66b9b33fc44>)'
                    });

                let content = `Successfully saved the wallpaper for ${user}!`;
                if (imageData.height !== 140 || imageData.width !== 315)
                    content += '\n\n⚠️ The image may be cut or stretched on the final output as it does not match the recommended size of **315x140**px. You may adjust the image with this [guide](<https://gist.github.com/maisans-maid/9313cf686ccd3a5b670fb66b9b33fc44>).'

                document.xp.push(subdocument);
                document.wallpaper = url;
                const data = await document.save().catch(e => e);

                if (data instanceof Error)
                    return interaction.editReply({
                          ephemeral: true,
                          content:   `Error: ${data.message}`
                    });

                return interaction.editReply({
                    ephemeral: true,
                    content
                });

            } else {
                if (document.wallpaper === null){
                    return interaction.reply({
                        ephemeral: true,
                        content: `${user} has no wallpaper to remove from!`
                    });
                };
                document.xp.push(subdocument);
                document.wallpaper = null;

                const data = await document.save().catch(e => e);

                if (data instanceof Error)
                    return interaction.reply({
                        ephemeral: true,
                        content:   `Error: ${data.message}`
                    });

                return interaction.reply({
                    ephemeral: true,
                    content:   `Successfully removed ${user}'s wallpaper!`
                });
            };
        };
    }
};
