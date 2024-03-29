import WAWebJS, {
  Client,
  GroupChat,
  GroupNotification,
  GroupNotificationTypes,
  Message,
  MessageMedia,
} from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import axios from "axios";

export const name = 'group'
export const commands: Command[] = [
  {
    name: 'user-joined',
    secret: true,
    description: 'Welcomes a new user to the group',
    examples: ['user-joined'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 0,
    signature: 'user-joined',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper, groupNotification?: GroupNotification) => {
      if(!groupNotification) {
        return await log.warn({ message: "user-joined called without group notification", client: client, telegramBot: telegramBot!})
      }

      try {

        const groupId: GroupId = groupNotification.id as GroupId
        if(!groupId) {
          return await log.error({ message: "Error getting chat for group welcome", client: client, telegramBot: telegramBot!})
        }

        const chat = await client.getChatById(groupId.remote)

        if(!chat) {
          return await log.error({ message: "Error getting chat for group welcome", client: client, telegramBot: telegramBot!})
        }

        const contacts = await groupNotification.getRecipients()
        const contact = contacts?.shift()

        if (!contact) {
          return await log.error({ message: "Error getting contact for group welcome", client: client, telegramBot: telegramBot!})
        }

        let messageContent = `Bienvenidx @${contact.number} al grupo ${chat.name}`

        let mentions = [contact]

        if (client.info.wid._serialized === contact.id._serialized) {
          messageContent = `Hola ${chat.name} soy LucioBot, enviá *!ayuda* para ver que puedo hacer`
          mentions = []
        }

        return await client.sendMessage(chat.id._serialized, messageContent, {
          mentions: mentions
        })
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'user-leave',
    secret: true,
    description: 'Says goodbye to a new user to the group',
    examples: ['user-leave'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 0,
    signature: 'user-leave',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper, groupNotification?: GroupNotification) => {
      if(!groupNotification) {
        return await log.warn({ message: "user-leave called without group notification", client: client, telegramBot: telegramBot!})
      }

      try {

        const groupId: GroupId = groupNotification.id as GroupId
        if(!groupId) {
          return await log.error({ message: "Error getting chat for group salute", client: client, telegramBot: telegramBot!})
        }

        const chat = await client.getChatById(groupId.remote)

        if(!chat) {
          return await log.error({ message: "Error getting chat for group salute", client: client, telegramBot: telegramBot!})
        }

        const contacts = await groupNotification.getRecipients()
        const contact = contacts?.shift()

        if (!contact) {
          return await log.error({ message: "Error getting contact for group salute", client: client, telegramBot: telegramBot!})
        }

        let messageContent = `A casa pete\n\n@${contact.number} fue eliminadx del grupo ${chat.name}`

        if (groupNotification.type === GroupNotificationTypes.LEAVE) {
          messageContent = `Hasta pronto\n\n@${contact.number} se fue del grupo ${chat.name}`
        }

        const mentions = [contact]

        if (client.info.wid._serialized === contact.id._serialized) {
          return log.info({ message:`Bot has been removed from group ${chat.name} ${chat.id._serialized}`, client: client, telegramBot: telegramBot!})
        }

        return await client.sendMessage(chat.id._serialized, messageContent, {
          mentions: mentions
        })
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'group-update',
    secret: true,
    description: 'Notifies group updates',
    examples: ['group-update'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 0,
    signature: 'group-update',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper, groupNotification?: GroupNotification) => {
      if(!groupNotification) {
        return await log.warn({ message: "group-update called without group notification", client: client, telegramBot: telegramBot!})
      }

      try {

        const groupId: GroupId = groupNotification.id as GroupId
        if(!groupId) {
          return await log.error({ message: "Error getting chat for group salute", client: client, telegramBot: telegramBot!})
        }

        const chat = (await client.getChatById(groupId.remote)) as GroupChat

        if(!chat) {
          return await log.error({ message: "Error getting chat for group salute", client: client, telegramBot: telegramBot!})
        }

        let messageContent = ""

        switch (groupNotification.type){
          case GroupNotificationTypes.SUBJECT:
            messageContent = `Nombre del grupo cambiado a *${chat.name}*`
            return await client.sendMessage(chat.id._serialized, messageContent)
          case GroupNotificationTypes.DESCRIPTION:
            messageContent = `Descripción del grupo cambiada a *${chat.description}*`
            if(!chat.description) {
              messageContent = "Descripción del grupo eliminada"
            }

            return await client.sendMessage(chat.id._serialized, messageContent)
          case GroupNotificationTypes.PICTURE:
            messageContent = "Nueva foto de grupo"
            const profilePicUrl = await client.getProfilePicUrl(chat.id._serialized)
            if(profilePicUrl) {
              const media = await MessageMedia.fromUrl(profilePicUrl)
              return await client.sendMessage(chat.id._serialized, media, {caption: messageContent})
            }
            else {
              return await client.sendMessage(chat.id._serialized, "Foto del grupo eliminada")
            }

          default:
            return await log.error({ message: `Group Notification Type not supported ${groupNotification.type}`, client: client, telegramBot: telegramBot!})
        }
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'join',
    secret: true,
    description: 'Bot joins group specified by parameter',
    examples: ['join https://chat.whatsapp.com/xxxxxxxxxxxxxxxxx'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: 1,
    signature: 'join <whatsapp-group-url>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      let url = args.join(" ");

      if (url.startsWith("https://chat.whatsapp.com/")) {
        url = url.split(".com/")[1]
      }

      try {
        const response = await client.acceptInvite(url)
        console.log(response)
        return await message.reply("Joined group successfully.")
      } catch (e) {
        console.log(e)
        await message.reply("That invite code seems to be invalid.")
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'message-revoked',
    secret: true,
    description: 'Triggered when a user revokes a message for everyone',
    examples: ['message-revoked'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 0,
    signature: 'message-revoked',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        let chat = await message.getChat() as GroupChat

        if(!chat) {
          return await log.error({ message: "Error getting chat for group welcome", client: client, telegramBot: telegramBot!})
        }

        const contact = await client.getContactById(message.author ?? '')

        if (!contact) {
          return await log.error({ message: "Error getting contact for group welcome", client: client, telegramBot: telegramBot!})
        }

        let messageContent = `Qué borras @${contact.number}? Te vi gil.`

        let mentions = [contact]

        return await client.sendMessage(chat.id._serialized, messageContent, {
          mentions: mentions
        })
      } catch (e) {
        console.log(e)
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  }
]

type GroupId = {
  fromMe: boolean,
  remote: string,
  id: string,
  _serialized: string
}