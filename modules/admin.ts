import { Client, Message } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'

export const name = 'admin'
export const commands: Command[] = [
  {
    name: 'notify',
    secret: true,
    description: 'Notifies every active chat the specified event',
    examples: ['notify shutdown 2', 'notify up'],
    adminOnly: true,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: 2,
    signature: 'notify <event> <time-hours>',
    run: async (message: Message, client: Client, args: string[]) => {
      const event = args[0]

      let time = 1

      if (args.length > 1) {
        time = Number(args[1])
      }

      try {
        let horaString = "horas"
        if (time === 1) {
          horaString = "hora"
        }

        let messageContent = ""

        switch (event) {
          case "shutdown":
            messageContent = `Estamos apagando el bot para mejorarlo, volvemos en ${time} ${horaString}`
            break;
          case "up":
            messageContent = "LucioBot está funcionando de nuevo"
            break;
          default:
            return await message.reply("Mass notification not supported: " + event)
        }

        const chats = await client.getChats()

        for (const [, chat] of chats.entries()) {
          await client.sendMessage(chat.id._serialized, messageContent)
        }

        return await message.reply("Notificaciones enviadas")
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]