'use strict'

import { Client, Message, MessageMedia } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'
import {getYtAudio, searchYoutube, downloadYoutubeVideo} from "../lib/arq-api"

export const name = 'youtube'
export const commands: Command[] = [
  {
    name: 'youtubeaudio',
    secret: false,
    description: 'Search and download mp3 youtube',
    examples: ['yes'],
    adminOnly: false,
    aliases: ['music', 'audio'],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    run: async (message: Message, client: Client, args: string[]) => {
      const query = args.join(" ");
      try {
        const ytResult = await searchYoutube(query)

        if (ytResult.ok) {
          const ytAudio = await getYtAudio(ytResult.result[0].id)

          if (ytAudio.status) {
            const audioB64 = ytAudio.audio ?? ''

            if (audioB64 === '') {
              return await message.reply(`Couldn't download audio for query\nhttps://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})
            }

            const media: MessageMedia = new MessageMedia("audio/mpeg", audioB64, ytAudio.filename ?? 'audio.mp3')

            const audioMessage = await message.reply(media, message.from)

            await audioMessage.reply(`https://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})

            return audioMessage
          } else {
            return await message.reply(ytAudio.msg ?? `Couldn't download audio for query *${query}*`, message.from, {linkPreview: true})
          }
        } else {
          return await message.reply(`No results for query *${query}*`)
        }
      } catch (e) {
        await message.reply(`Couldn't download audio for query *${query}*`)
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
    aliases: ['video', 'vid'],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    run: async (message: Message, client: Client, args: string[]) => {
      const query = args.join(" ");
      try {
        const ytResult = await searchYoutube(query)

        if (ytResult.ok) {
          const ytVideo = await downloadYoutubeVideo(ytResult.result[0].id)

          if (ytVideo.status) {
            const videoB64 = ytVideo.video ?? ''

            if (videoB64 === '') {
              return await message.reply(`Couldn't download video for query *${query}*`)
            }

            const media: MessageMedia = new MessageMedia(ytVideo.mimetype ?? 'video/mp4', videoB64, ytResult.result[0].title + ".mp4")

            const videoMessage = await message.reply(media, message.from)

            await videoMessage.reply(`https://youtu.be${ytResult.result[0].url_suffix}`, message.from, {linkPreview: true})

            return videoMessage
          } else {
            return await message.reply(ytVideo.msg ??  `Couldn't download video for query *${query}*`, message.from, {linkPreview: true})
          }
        } else {
          return await message.reply(`No results for query *${query}*`)
        }
      } catch (e) {
        await message.reply(`Couldn't download video for query *${query}*`)
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]
