import { Client, Message, MessageMedia, MessageTypes } from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import axios from "axios";

export const name = 'twitter'
export const commands: Command[] = [
  {
    name: 'twitter',
    secret: false,
    description: 'Download Twitter videos.\n' +
      '1 argument: tweet URL',
    examples: ['twitter https://twitter.com/AmongUsGame/status/1403059335689736194'],
    adminOnly: false,
    aliases: ['tweet', 'tw'],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 1,
    signature: 'twitter <tweet_url>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      let twitterUrl = ""

      if (args.length === 0) {
        if (message.hasQuotedMsg) {
          const quotedMessage = await message.getQuotedMessage()
          if (message.type === MessageTypes.TEXT) {
            twitterUrl = quotedMessage.body
          }
        }
      }
      else {
        twitterUrl = args[0]
      }

      if (twitterUrl === "") return await message.reply("Couldn't download video, please provide a valid twitter url")

      try {
        const isTwitterUrl = /^https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)?\??.*/i

        if (!isTwitterUrl.test(twitterUrl)) {
          return await message.reply(`Please send me link of a tweet containing a video.`)
        }

        const twitFixUrl = twitterUrl.replace("twitter.com", "fxtwitter.com/dir")

        const response = await axios.get(twitFixUrl, { responseType: 'arraybuffer' })

        if (Object.keys(response.headers).includes("content-type")) {
          if(response.headers["content-type"] === "video/mp4") {
            const base64Video = Buffer.from(response.data).toString('base64')

            const media: MessageMedia = new MessageMedia('video/mp4', base64Video, 'twitter-video.mp4')

            return await message.reply(media, message.from)
          }
        }
        return await message.reply(`Please send me link of a tweet containing a video.`)
      } catch (e) {
        await message.reply(`Couldn't download video for ${twitterUrl}`)
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  }
]
