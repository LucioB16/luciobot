'use strict'

import { Client, Message, MessageMedia } from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import { getImage } from "../lib/arq-api"
import axios from "axios";

export const name = 'image'
export const commands: Command[] = [
  {
    name: 'image',
    secret: false,
    description: 'Searches and gets random image',
    examples: ['image amogus'],
    adminOnly: false,
    aliases: ['imagen', 'foto','photo'],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'image <query>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      const query = args.join(" ");
      try {
        const imageResult = await getImage(query)

        if (imageResult.ok) {
          const results = imageResult.result ?? []
          if (results.length > 0) {
            const image = results[Math.floor(Math.random() * results.length)]

            const media = await MessageMedia.fromUrl(image.url)
            return await message.reply(media, message.from, { caption: image.title })
          }
        }
        return await message.reply(`Couldn't download image for query *${query}*`)
      } catch (e) {
        await message.reply(`Couldn't download image for query *${query}*`)
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  }
]
