import { Client, Message, MessageMedia, MessageTypes } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'
import axios from 'axios'

export const name = 'code'
export const commands: Command[] = [
  {
    name: 'code',
    secret: false,
    description: 'Takes some code and makes an image with carbon.now.sh.\n' +
      'First argument: language (you can use auto for automatic syntax)\n' +
      'The rest of the text is used as input',
    examples: ['code javascript console.log("Hello World!")'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'code <language> <input_text>',
    run: async (message: Message, client: Client, args: string[]) => {
      let language = args[0]
      let inputText: string
      try {
        if (message.hasQuotedMsg) {
          let quotedMessage = await message.getQuotedMessage()

          if (quotedMessage.type !== MessageTypes.TEXT) {
            return await message.reply('Please quote a text message.')
          }
          inputText = quotedMessage.body
        } else {
          inputText = args.slice(1).join(' ')
        }

        const media: MessageMedia = new MessageMedia('image/png', await genCarbon(inputText, language))

        return await message.reply('Generated with carbon.now.sh', message.from, { media: media })
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]

const genCarbon = async (text: string, language: string) => {
  const url = "https://carbonnowsh.herokuapp.com/"
  const body = {
    code: escapeJson(text),
    language: language
  }

  const response = await axios.post(url, body, { responseType: 'arraybuffer' })
  const base64Data = Buffer.from(response.data, 'binary').toString('base64')
  return (base64Data)
}

function escapeJson(value: string): string {
  return  value.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");
}
