import { Client, Message, MessageTypes } from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import * as translator from '../lib/translator'

export const name = 'translator'

const description = "Traduce un mensaje, el primer parámetro es el lenguaje del texto y el segundo es el lenguaje al que se quiere traducir" +
  "\n\nLenguajes soportados:\n" +
  "en  English\n" +
  "ar  Arabic\n" +
  "az  Azerbaijani\n" +
  "zh  Chinese\n" +
  "cs  Czech\n" +
  "nl  Dutch\n" +
  "eo  Esperanto\n" +
  "fi  Finnish\n" +
  "fr  French\n" +
  "de  German\n" +
  "el  Greek\n" +
  "hi  Hindi\n" +
  "hu  Hungarian\n" +
  "id  Indonesian\n" +
  "ga  Irish\n" +
  "it  Italian\n" +
  "ja  Japanese\n" +
  "ko  Korean\n" +
  "fa  Persian\n" +
  "pl  Polish\n" +
  "pt  Portuguese\n" +
  "ru  Russian\n" +
  "sk  Slovak\n" +
  "es  Spanish\n" +
  "sv  Swedish\n" +
  "tr  Turkish\n" +
  "uk  Ukranian\n" +
  "vi  Vietnamese"

export const commands: Command[] = [
  {
    name: 'translate',
    secret: false,
    description: description,
    examples: ['translate en es', 'translate es pt'],
    adminOnly: false,
    aliases: ['traducir'],
    cooldown: 0,
    minArgs: 2,
    maxArgs: 2,
    signature: 'translate <source> <target>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        if (!message.hasQuotedMsg) {
            return await message.reply("Respondé a un mensaje de texto")
        }

        let quotedMessage = await message.getQuotedMessage()

        if (quotedMessage.type !== MessageTypes.TEXT) {
            return await message.reply("Respondé a un mensaje de texto")
        }

        const sourceText = quotedMessage.body

        const sourceLang = args[0]

        const targetLang = args[1]

        const targetText = await translator.translate(sourceText, sourceLang, targetLang)

        if (targetText === "") {
          return await message.reply("Error al traducir texto")
        }

        return await message.reply(targetText)
      }
      catch (err) {
        await message.reply("Error al traducir texto")
        return await log.error({ message: JSON.stringify(err), client: client, telegramBot: telegramBot!})
      }
    }
  }
]
