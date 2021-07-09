import {Client, Message} from 'whatsapp-web.js'
import {Command} from "../luciobot";
import * as log from "../lib/log";

export const name = 'echo'
export const commands: Command[] = [
  {
    name: 'echo',
    secret: false,
    description: 'Takes your input and spits it right back at you.',
    examples: ['yes'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    run: async (message: Message, client: Client, args: string[]) => {
      let out = args.join(' ')
      try {
        return await message.reply(out)
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]