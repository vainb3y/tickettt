let hastebin = require('hastebin');
const discord = require("discord.js");

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client, msg) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: 'Zaten bir Bilet oluşturdunuz!',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `Bilet Oluşturuldu! <#${c.id}>`,
          ephemeral: true
        });

        const embed = new discord.MessageEmbed()
          .setColor('6d6ee8')
          .setAuthor({ name: 'Bilet', iconURL: 'https://i.imgur.com/oO5ZSRK.png' })
          .setDescription('Biletinizin kategorisini seçin!')
          .setFooter('lynxbot.cf', 'https://i.imgur.com/oO5ZSRK.png')
          .setTimestamp();

        const row = new discord.MessageActionRow()
          .addComponents(
            new discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Bir Bilet Kategorisi seç!')
            .addOptions([{
                label: 'Yardım',
                value: 'yardım',
                emoji: '🙏',
              },
              {
                label: 'Reklam',
                value: 'reklam',
                emoji: '🌟',
              },
              {
                label: 'Sponsor',
                value: 'sponsor',
                emoji: '👑',
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new discord.MessageEmbed()
                  .setColor('6d6ee8')
                  .setAuthor({ name: 'Bilet', iconURL: 'https://i.imgur.com/oO5ZSRK.png'})
                  .setDescription(`<@!${interaction.user.id}> ${i.values[0]} bileti oluşturuldu`)
                  .setFooter('lynxbot.cf', 'https://i.imgur.com/oO5ZSRK.png')
                  .setTimestamp();

                const row = new discord.MessageActionRow()
                  .addComponents(
                    new discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Bileti Kapat')
                    .setEmoji('⚠️')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
            if (i.values[0] == 'yardım') {
              c.edit({
                parent: client.config.parentTransactions
              });
            };
            if (i.values[0] == 'reklam') {
              c.edit({
                parent: client.config.parentJeux
              });
            };
            if (i.values[0] == 'sponsor') {
              c.edit({
                parent: client.config.parentAutres
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Kategori seçilmedi. Bileti kapatım...`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 5000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new discord.MessageActionRow()
        .addComponents(
          new discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Evet')
          .setStyle('DANGER'),
          new discord.MessageButton()
          .setCustomId('no')
          .setLabel('Hayır')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Bileti kapatmak istediğinizden emin misiniz?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Bilet <@!${interaction.user.id}> Tarafından Kapatıldı!`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new discord.MessageEmbed()
                .setColor('6d6ee8')
                .setAuthor({ name: 'Bilet', iconURL: 'https://i.imgur.com/oO5ZSRK.png'})
                .setDescription('```Bilet kontrolü```')
                .setFooter('lynxbot.cf', 'https://i.imgur.com/oO5ZSRK.png')
                .setTimestamp();

              const row = new discord.MessageActionRow()
                .addComponents(
                  new discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Bileti Sil')
                  .setEmoji('🗑️')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'İptal etim!',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Bilet Zaman Aşımına Uğradı!',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);
      const { getPasteUrl, PrivateBinClient } = require('@agc93/privatebin');
      interaction.reply({
        content: 'Mesajlar kaydediliyor...'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('fr-FR')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
   /*     if (a.length < 1) a = "Nothing"
       hastebin.createPaste(a, {
            contentType: 'text/plain',
            server: 'https://www.toptal.com/developers/hastebin/'
          }, {}) */
        var paste = new PrivateBinClient("https://privatebin.net/");
        var result = await paste.uploadContent(a, {uploadFormat: 'plaintext'})
        
      
            const embed = new discord.MessageEmbed()
              .setAuthor({ name: 'Bilet Logu', iconURL: 'https://i.imgur.com/oO5ZSRK.png' })
              .setDescription(`📰 <@!${chan.topic}> Tarafından Oluşturulan ve <@!${interaction.user.id}> Tarafından Silinen \`${chan.id}\` Biletinin \n\nLogları: [**Logları görmek için tıkla!**](${getPasteUrl(result)})`)
              .setColor('2f3136')
              .setTimestamp();

            const embed2 = new discord.MessageEmbed()
              .setAuthor({ name: 'Bilet Logu', iconURL: 'https://i.imgur.com/oO5ZSRK.png' })
              .setDescription(`📰 \`${chan.id}\` Biletinin logları: [**Logları görmek için tıkla!**](${getPasteUrl(result)})`)
              .setColor('2f3136')
              .setTimestamp();

            client.channels.cache.get(client.config.logsTicket).send({
              embeds: [embed]
            });
            client.users.cache.get(chan.topic).send({
              embeds: [embed2]
            }).catch(() => {console.log('I can\'t dm him :(')});
            chan.send('Kanal Siliniyor...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
    };
  },
};
