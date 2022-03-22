import { Client, Contact, Message} from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import * as dbReminder from '../lib/reminder'

export const name = 'reminder'

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

        const expiresAt = new Date()

        expiresAt.setHours(expiresAt.getHours() + hours)

        const content = args.slice(1).join(' ')

        const mentions = await message.getMentions()

        const mentionedContacts: string[] = []

        for (let mention of mentions) {
          mentionedContacts.push(mention.id._serialized)
        }

        const chatId = (await message.getChat()).id._serialized
        const author = message.author ?? message.from
        await dbReminder.createReminder({
          chatId: chatId,
          author: author,
          expiresAt: expiresAt,
          mentions: mentionedContacts,
          content: content
        })
        const replyText = `Recordatorio registrado para dentro de ${args[0]} horas\n\nTexto:\n${content}`

        return message.reply(replyText, message.from, { mentions: mentions })
      }
      catch (err) {
        return await log.error({ message: JSON.stringify(err), client: client, telegramBot: telegramBot!})
      }
    }
  }
]

const checkReminders = async (client: Client) => {
  const reminders = await dbReminder.getExpiredReminders()

  for (let reminder of reminders) {

    const mentions: Contact[] = []

    for (let mention of reminder.mentions) {
      let contact = await client.getContactById(mention)
      mentions.push(contact)
    }

    await client.sendMessage(reminder.chatId, reminder.content, { mentions: mentions })

    await dbReminder.deleteReminder(reminder.id)
  }
}

export const jobs = [
  {
    period: 300,
    runInstantly: false,
    job: checkReminders
  }
]