import { Client, Message} from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import * as translator from '../lib/translator'

export const name = 'translator'

export const commands: Command[] = [
  {
    name: 'translate',
    secret: false,
    description: 'Traduce un mensaje, el primer parámetro es el lenguaje del texto y el segundo es el lenguaje al que se quiere traducir',
    examples: ['translate en es', 'translate es pt'],
    adminOnly: false,
    aliases: ['traducir'],
    cooldown: 0,
    minArgs: 2,
    maxArgs: 2,
    signature: 'translate <origin> <target>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        if (!message.hasQuotedMsg) {
            return await message.reply("Respondé a un mensaje de texto")
        }

        let quotedMessage = await message.getQuotedMessage()

        if (quotedMessage.type !== MessageTypes.TEXT) {
            return await message.reply("Respondé a un mensaje de texto")
        }

        const originText = quotedMessage.body

        const sourceLang = args[0]

        const targetLang = args[1]
        
        const targetText = await translator.translate(originText, sourceLang, targetLang)

        return await message.reply(targetText)
      }
      catch (err) {
        await message.reply("Error al traducir texto")
        return await log.error({ message: JSON.stringify(err), client: client, telegramBot: telegramBot!})
      }
    }
  }
]
diff --git a/lib/translator.ts b/lib/translator.ts
