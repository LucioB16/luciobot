import { Client, Message, Buttons } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'

export const name = 'poll'
export const commands: Command[] = [
  {
    name: 'poll',
    secret: false,
    description: 'Notifies every active chat the specified event',
    examples: ['poll 3'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: Infinity,
    signature: 'poll <number>',
    run: async (message: Message, client: Client, args: string[]) => {
      const number = Number(args.join(" "))

      try {
        let buttonArray = []

        for (let i = 1; i <= number; i++) {
          let button = ["body", `Boton ${i}`]
          buttonArray.push(button)
        }

        const buttons = new Buttons('*Seleccione una opción:*', buttonArray , 'Título', 'Pie')
        return await client.sendMessage(message.from, buttons)
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]