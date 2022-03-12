import { Client, Message} from 'whatsapp-web.js'
import {Command, whatsappClient} from '../luciobot'
import * as log from '../lib/log'

export const name = 'help'
export const commands: Command[] = [
  {
    name: 'help',
    secret: false,
    description: 'Returns the description and example of every command available',
    examples: ['help', 'help image'],
    adminOnly: false,
    aliases: ['ayuda'],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 1,
    signature: 'help <command_name (Optional)>',
    run: async (message: Message, client: Client, args: string[]) => {
      try {
        const prefix = whatsappClient.prefixes.has(message.from) ? whatsappClient.prefixes.get(message.from) : '!'

        if (args.length > 0) {
          const commandName = args[0]
          let command: Command = commands[0]
          if (whatsappClient.loadedCommands.has(commandName)) {
            command = whatsappClient.loadedCommands.get(commandName) ?? commands[0]
          }
          else {
            return await message.reply(`Command *${commandName}* doesn't exist`)
          }

          if (!(command.secret || command.adminOnly)) {
            let outMessage = `Command: *${prefix + command.name}*\n`

            if (command.aliases && command.aliases.length > 0) {
              outMessage += command.aliases.length > 1 ? "\nAliases:\n" : "\nAlias:\n"
              for (const alias of command.aliases) {
                outMessage += prefix + alias + "\n"
              }
            }

            outMessage += `\nUsage: ${prefix + command.signature}\n`

            outMessage += `\nMin arguments: ${command.minArgs}\nMax arguments: ${command.maxArgs}\n`

            if (command.cooldown) {
              outMessage += `\nCooldown: ${command.cooldown} seconds\n`
            }

            outMessage += `\nDescription: ${command.description}\n`

            if (command.examples.length > 0) {
              outMessage += command.examples.length > 1 ? "\nExamples:\n" : "\nExample:\n"
              for (const example of command.examples) {
                outMessage += "\n" + prefix + example + "\n"
              }
            }

            return await message.reply(outMessage)
          }

          return await message.reply(`Command *${commandName}* doesn't exist`)
        }
        else {
          let outMessage = "Here's a list of all the currently active commands:\n\n"
          const usedCommands: string[] = []

          for (const [, command] of whatsappClient.loadedCommands.entries()) {
            if (!(command.secret || command.adminOnly) && !usedCommands.includes(command.name)) {
              usedCommands.push(command.name)
              outMessage += prefix + command.signature + "\n"
            }
          }

          return await message.reply(outMessage)
        }
      } catch (e: any) {
        return log.error(e, client)
      }
    }
  }
]