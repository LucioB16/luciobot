import { Client, Message, MessageMedia, MessageSendOptions, MessageTypes } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'

export const name = 'sticker'
export const commands: Command[] = [
  {
    name: 'sticker',
    secret: false,
    description: 'Takes your image/video and makes a sticker out of it.\n' +
      'You have to reply a message that contains an image or send an image with its caption containing the command\n\n' +
      'First argument (optional): sticker name\nSecond Argument: sticker author\n' +
      'Third argument (optional): emojis used to search the sticker (comma separated)',
    examples: ['sticker amogus imposter 👨‍🚀,🚀,🔴'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 3,
    signature: 'sticker <sticker_name (optional)> <sticker_author (optional)> <emojis (optional)>',
    run: async (message: Message, client: Client, args: string[]) => {
      const messageOptions: MessageSendOptions = { sendMediaAsSticker: true }
      switch (args.length) {
        case 0:
          break
        case 1:
          messageOptions.stickerName = args[0]
          break
        case 2:
          messageOptions.stickerName = args[0]
          messageOptions.stickerAuthor = args[1]
          break
        case 3:
          messageOptions.stickerName = args[0]
          messageOptions.stickerAuthor = args[1]
          let argCategories = args[2]
          if (argCategories.length > 2) {
            messageOptions.stickerCategories = argCategories.split(',')
          } else {
            messageOptions.stickerCategories = [argCategories[0]]
          }
          break
        default:
          throw new Error('Error getting arguments for sticker.')
      }

      try {
        let media: MessageMedia

        if (message.hasMedia) {
          if (message.type !== MessageTypes.IMAGE) {
            return await message.reply("Can't convert anything other than images to stickers.")
          }
          media = await message.downloadMedia()
        } else if (message.hasQuotedMsg) {
          let quotedMessage = await message.getQuotedMessage()

          if (quotedMessage.type !== MessageTypes.IMAGE) {
            return await message.reply("Can't convert anything other than images to stickers.")
          }

          if (quotedMessage.hasMedia) {
            media = await quotedMessage.downloadMedia()
          } else {
            return await message.reply('Image/video not found in message or quoted message.')
          }
        } else {
          return await message.reply('Image/video not found in message.')
        }

        return await message.reply(media, message.from, messageOptions)
      } catch (e) {
        await message.reply("Couldn't generate sticker")
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]
