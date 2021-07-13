'use strict'

import { Client, Message, MessageMedia } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'
import {getYtAudio, getYtVideo, searchYoutube} from "../lib/arq-api"

export const name = 'youtube'
export const commands: Command[] = [
  {
    name: 'youtube',
    secret: false,
    description: 'Search and download mp3 youtube',
    examples: ['yes'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    run: async (message: Message, client: Client, args: string[]) => {
      const query = args.join(" ");
      try {
        const ytResult = await searchYoutube(query)

        if (ytResult.ok) {
          const duration = ytResult.result[0].duration.split(':')

          if(duration.length > 2) {
            return await message.reply(`Can't send audio over 15 minutes\nhttps://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})
          }

          if (parseInt(duration[0]) > 15) {
            return await message.reply(`Can't send audio over 15 minutes\nhttps://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})
          }

          const ytAudio = await getYtAudio(ytResult.result[0].id)

          if (ytAudio.status) {
            const audioB64 = ytAudio.audio ?? ''

            if (audioB64 === '') {
              return await message.reply(`Couldn't download audio for query\nhttps://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})
            }

            const media: MessageMedia = new MessageMedia("audio/mpeg", audioB64, ytAudio.filename)

            const audioMessage = await message.reply(media, message.from)

            await audioMessage.reply(`https://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})

            return audioMessage
          } else {
            return await message.reply(`Couldn't download audio for query *${query}*`)
          }
        } else {
          return await message.reply(`No results for query *${query}*`)
        }


      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  },
  {
    name: 'youtubevideo',
    secret: false,
    description: 'Search and download mp3 youtube',
    examples: ['yes'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    run: async (message: Message, client: Client, args: string[]) => {
      const query = args.join(" ");
      try {
        const ytResult = await searchYoutube(query)

        if (ytResult.ok) {
          const duration = ytResult.result[0].duration.split(':')

          if(duration.length > 2) {
            return await message.reply(`Can't download video over 15 minutes\nhttps://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})
          }

          if (parseInt(duration[0]) > 15) {
            return await message.reply(`Can't download video over 15 minutes\nhttps://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})
          }

          const ytVideo = await getYtVideo(ytResult.result[0].id)


          if (ytVideo.status) {
            const videoB64 = ytVideo.video ?? ''

            if (videoB64 === '') {
              return await message.reply(`Results for https://youtu.be${ytResult.result[0].url_suffix}\n${ytVideo.msg}`,message.from, { linkPreview: true })
            }

            const media: MessageMedia = new MessageMedia(ytVideo.mimetype ?? 'video/mp4', videoB64, ytVideo.filename)

            const videoMessage = await message.reply(media, message.from)

            await videoMessage.reply(`https://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})

            return videoMessage
          } else {
            return await message.reply(`Couldn't download video for query *${query}*`)
          }
        } else {
          return await message.reply(`No results for query *${query}*`)
        }


      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }

]