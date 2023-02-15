const discord = require("discord.js");

module.exports = {
  name: 'ready',
  async execute(client) {
    console.log('Shadow Ticket Bot ready!')
    console.log('Komutlar hazır! Developed with the ❤️ by shadow');
    const oniChan = client.channels.cache.get(client.config.ticketChannel)

    function sendTicketMSG() {
      const embed = new discord.MessageEmbed()
        .setColor('6d6ee8')
        .setAuthor({ name: 'Bilet', iconURL: client.user.avatarURL() })
        .setDescription('🔥 `Bilet aç` Butonuna Tıklayarak Bilet/Ticket aça Bilirsin!\n\n⭐ Anlık Ping: '+ client.ws.ping+'ms!')
        .setFooter('lynxbot.cf', client.user.avatarURL())
      const row = new discord.MessageActionRow()
        .addComponents(
          new discord.MessageButton()
          .setCustomId('open-ticket')
          .setLabel('Bilet aç')
          .setEmoji('✉️')
          .setStyle('PRIMARY'),
        );

      oniChan.send({
        embeds: [embed],
        components: [row]
      })
    }

    const toDelete = 10000;

    async function fetchMore(channel, limit) {
      if (!channel) {
        throw new Error(`Bilet Limiti, Beklemen gerek ${typeof channel}.`);
      }
      if (limit <= 100) {
        return channel.messages.fetch({
          limit
        });
      }

      let collection = [];
      let lastId = null;
      let options = {};
      let remaining = limit;

      while (remaining > 0) {
        options.limit = remaining > 100 ? 100 : remaining;
        remaining = remaining > 100 ? remaining - 100 : 0;

        if (lastId) {
          options.before = lastId;
        }

        let messages = await channel.messages.fetch(options);

        if (!messages.last()) {
          break;
        }

        collection = collection.concat(messages);
        lastId = messages.last().id;
      }
      collection.remaining = remaining;

      return collection;
    }

    const list = await fetchMore(oniChan, toDelete);

    let i = 1;

    list.forEach(underList => {
      underList.forEach(msg => {
        i++;
        if (i < toDelete) {
          setTimeout(function () {
            msg.delete()
          }, 1000 * i)
        }
      })
    })

    setTimeout(() => {
      sendTicketMSG()
    }, i);
  },
};
