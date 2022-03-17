import { Client, Contact, List, Message, MessageSendOptions, MessageTypes } from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'

export const name = 'reminder'

type ContactDB = {
  contactId: string,
  number: string
}

export const commands: Command[] = [
  {
    name: 'reminder',
    secret: false,
    description: 'Creates a reminder',
    examples: ['reminder 6 traigan cubiertos'],
    adminOnly: false,
    aliases: ['recordatorio'],
    cooldown: 0,
    minArgs: 2,
    maxArgs: Infinity,
    signature: 'poll <hours> <content>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        const hours = Number(args[0])

        if (isNaN(hours)) {
          return message.reply('El primer argumento debe ser un número de hora')
        }

        const content = args.slice(1).join(' ')

        const mentions = await message.getMentions()

        let mentionedContacts: ContactDB[] = []

        for (let mention of mentions) {
          mentionedContacts.push({
            contactId: mention.id._serialized,
            number: mention.number
          })
        }

        // TODO: insert reminder in DB

        const replyText = `Recordatorio registrado para dentro de ${args[0]} horas\nTexto: ${content}`

        return message.reply(replyText, message.from, { mentions: mentions })
      }
      catch (err) {
        return await log.error({ message: JSON.stringify(err), client: client, telegramBot: telegramBot!})
      }
    }
  }
]

const checkReminders = async (client: Client) => {
  // TODO: get reminders from DB and send them
}

export const jobs = [
  {
    period: 300,
    runInstantly: false,
    job: checkReminders
  }
]