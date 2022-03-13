import { Client, Message, MessageMedia, MessageTypes } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'
import * as TikTokScraper from 'tiktok-scraper'
import { Options } from "tiktok-scraper"
import * as tmp from 'tmp'
import * as fs from "fs-extra"

export const name = 'tiktok'
export const commands: Command[] = [
  {
    name: 'tiktok',
    secret: false,
    description: 'Download TikTok videos.\n' +
      '1 argument: tiktok video URL',
    examples: ['tiktok https://www.tiktok.com/@amongus/video/6970027065793875206'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 1,
    signature: 'tiktok <tiktok_url>',
    run: async (message: Message, client: Client, args: string[]) => {
      const tmpDir = tmp.dirSync()

      const options: Options = {
        number: 1,
        filepath: tmpDir.name,
        fileName: "tiktok-video",
        filetype: `na`,
        sessionList: ['sid_tt=58cdb854b9de4c402e0e66fc786cff82'],
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36",
          "referer": "https://www.tiktok.com/",
          "cookie": "tt_webid_v2=6960821647082063366"
        },
        download: true
      }

      let tiktokUrl = ""

      if (args.length === 0) {
        if (message.hasQuotedMsg) {
          const quotedMessage = await message.getQuotedMessage()
          if (message.type === MessageTypes.TEXT) {
            tiktokUrl = quotedMessage.body
          }
        }
      }
      else {
        tiktokUrl = args[0]
      }

      if (tiktokUrl === "") return await message.reply("Couldn't download video, please provide a valid tiktok url")

      try {
        const videoMeta = await TikTokScraper.getVideoMeta(tiktokUrl, options);

        if (videoMeta && videoMeta.collector.length > 0) {
          const tiktokData = videoMeta.collector[0]

          const video = await TikTokScraper.video(tiktokUrl, options)

          const base64Video = fs.readFileSync(`${tmpDir.name}/${tiktokData.id}.mp4`, {encoding: 'base64'})

          const media: MessageMedia = new MessageMedia('video/mp4', base64Video, 'tiktok-video.mp4')

          const caption = `👤 ${tiktokData.authorMeta.name}\n${tiktokData.text}\n\n♥ ${tiktokData.diggCount}\n▶ ${tiktokData.playCount}\n💬 ${tiktokData.commentCount}\n🔃 ${tiktokData.shareCount}`

          await fs.emptydir(tmpDir.name)

          tmpDir.removeCallback()

          return await message.reply(media, message.from, { caption: caption })
        }
        return await message.reply(`Couldn't download video for ${tiktokUrl}`)
      } catch (e) {
        await fs.emptydir(tmpDir.name)
        tmpDir.removeCallback()
        await message.reply(`Couldn't download video for ${tiktokUrl}`)
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]
