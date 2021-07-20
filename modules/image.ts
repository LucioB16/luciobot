'use strict'

import { Client, Message, MessageMedia } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'
import { getImage } from "../lib/arq-api"
import axios from "axios";

export const name = 'image'
export const commands: Command[] = [
  {
    name: 'image',
    secret: false,
    description: 'Search and download mp3 youtube',
    examples: ['yes'],
    adminOnly: false,
    aliases: ['imagen', 'foto','photo'],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    run: async (message: Message, client: Client, args: string[]) => {
      const query = args.join(" ");
      try {
        const imageResult = await getImage(query)

        if (imageResult.ok) {
          const results = imageResult.result ?? []
          if (results.length > 0) {
            const image = results[Math.floor(Math.random() * results.length)]

            const imageB64 = Buffer.from((await axios.get(image.url, { responseType: 'arraybuffer' })).data).toString('base64')

            const media = new MessageMedia('image/jpeg', imageB64)

            return await message.reply(media, message.from, { caption: image.title })
          }
        }
        return await message.reply(`Couldn't download image for query *${query}*`)
      } catch (e) {
        await message.reply(`Couldn't download image for query *${query}*`)
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]
