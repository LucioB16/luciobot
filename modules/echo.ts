import { Client, Message } from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'

export const name = 'echo'
export const commands: Command[] = [
  {
    name: 'echo',
    secret: true,
    description: 'Takes your input and spits it right back at you.',
    examples: ['echo hello'],
    adminOnly: true,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'echo <input>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      let out = args.join(' ')
      try {
        return await message.reply(out)
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  }
]
