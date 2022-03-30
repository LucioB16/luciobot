'use strict'

import {
  Client,
  ClientOptions,
  Events,
  GroupNotification,
  List,
  LocalAuth,
  Message,
  MessageTypes
} from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal'
import * as qrImage from 'qr-image'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as log from './lib/log'
import { mockMessage } from './lib/mock-wa'
import { startBot } from './lib/telegram'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'typegram'

dotenv.config()

type ClientWrapper = {
  prefixes: Map<string, string>,
  loadedCommands: Map<string, Command>,
  loadedModules: Map<string, Module>,
  [key: string]: any
}

const clientOptions: ClientOptions = {
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  authStrategy: new LocalAuth()
}

const chromePath = process.env.CHROME_PATH ?? ''

if (chromePath !== '') {
  if (clientOptions.puppeteer) {
    clientOptions.puppeteer['executablePath'] = chromePath
  }
}

const client = new Client(clientOptions)

export type TelegramBotWrapper = {
  bot? : Telegraf<Context<Update>>,
  notificationsChannelId : string
}

let telegram: TelegramBotWrapper | null

let botPromise = startBot(process.env.TELEGRAM_BOT_TOKEN as string)

Promise.all([botPromise]).then((result) => {
  if (result.length > 0) {
    telegram = {
      bot : result[0],
      notificationsChannelId : process.env.TELEGRAM_CHANNEL_ID as string
    }
  }
})
  .catch((err) => log.error({message: JSON.stringify(err)}))

export const whatsappClient: ClientWrapper = {
  loadedCommands: new Map<string, Command>(),
  loadedModules: new Map<string, Module>(),
  prefixes: new Map<string, string>() // TODO: get from DB
}

whatsappClient['client'] = client

whatsappClient['log'] = log

if (!process.env.OWNER_WHATSAPP_ID) {
  log.error({message: 'No owner user WhatsApp ID supplied. Set the OWNER_WHATSAPP_ID environment variable.', telegramBot: telegram!})
}

const ownerId = process.env.OWNER_WHATSAPP_ID ?? ''

client.on(Events.QR_RECEIVED, (qr) => {
  qrcode.generate(qr, { small: true })
  if (telegram && telegram.bot) {
    const image = qrImage.image(qr, { type: 'png' })
    telegram.bot.telegram.sendPhoto(telegram.notificationsChannelId, {source: image})
  }

  log.info({ message: 'Scan the QR Code to start the whatsapp web client.', telegramBot: telegram!})
})

client.on(Events.AUTHENTICATED, (session) => {
  if (session === undefined) {
    log.info({ message: 'Auth successful', telegramBot: telegram!})
  }
  else {
    log.info({ message:'Copy the value below without line breaks and set it to WA_SESSION environment variable.\n' +
      `'${JSON.stringify(session)}'`, telegramBot: telegram!})
  }
})

client.on(Events.AUTHENTICATION_FAILURE, (message) => {
  log.error({ message:`Auth failure: ${message}`, telegramBot: telegram!})
})

export type Command = {
  name: string,
  description: string,
  examples: string[],
  minArgs: number
  maxArgs: number,
  adminOnly: boolean,
  secret?: boolean,
  cooldown?: number,
  aliases?: string[],
  signature: string,
  run (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper, groupNotification?: GroupNotification): Promise<Message | undefined>
}

export type Event = {
  trigger: string,
  event (): Promise<any>  // TODO: is this correct? Verify with further examples
}

export type Job = {
  period: number,
  runInstantly: boolean,
  job (client: Client): Promise<void>,
  interval: NodeJS.Timeout
}

export type Module = {
  name: string,
  commands?: Command[]
  jobs?: Job[],
  events?: Event[],
  loadOnBoot?: boolean
}

let savedModules: string[] = []

const saveModule = (module: Module) => {
  if (!savedModules.includes(module.name)) {
    savedModules.push(module.name)
    whatsappClient.loadedModules.set(module.name, module)
  }
}

const removeModule = (module: Module) => {
  if (savedModules.includes(module.name)) {
    whatsappClient.loadedModules.delete(module.name)
  }
}

export const availableModules: string[] = []

export const loadModule = (name: string, initial: boolean = false) => {
  import(`./modules/${name}`).then((module: Module) => {
    if (initial && module.loadOnBoot != null && !module.loadOnBoot && !savedModules.includes(name)) {
      return
    }

    saveModule(module)

    if (module.jobs) {
      module.jobs.map((x: Job) => {
        x.interval = setInterval(() => x.job(client), x.period * 1000)
        if (x.runInstantly) {
          x.job(client)
            .catch((err) => log.warn({ message: err, telegramBot: telegram!}))
        }
      })
    }
    if (module.commands) {
      module.commands.map(command => {
        const possibleNames = command.aliases
          ? command.aliases.concat([command.name])
          : [command.name]
        possibleNames.map(name => {
          whatsappClient.loadedCommands.set(name, command)
        })
      })
    }
    if (module.events) {
      module.events.map(async (event: Event) => {
        client.on(event.trigger, event.event)
      })
    }
    whatsappClient.loadedModules.set(name, module)
  }).catch(err => log.warn({ message:err, client: client, telegramBot: telegram!}))
}

export const unloadModule = (name: string) => {
  const module = whatsappClient.loadedModules.get(name)
  let possibleNames: string[]

  if (module) {
    removeModule(module)
    if (module.jobs && module.jobs.length > 0) {
      module.jobs.forEach((job: Job) => {
        clearInterval(job.interval)
      })
    }

    if (module.events && module.events.length > 0) {
      module.events.forEach((event: Event) => {
        client.removeListener(event.trigger, event.event)
      })
    }

    if (module.commands && module.commands.length > 0) {
      module.commands.forEach((command: Command) => {
        possibleNames = command.aliases
          ? command.aliases.concat([command.name])
          : [command.name]
        possibleNames.map(commandName => {
          Reflect.deleteProperty(whatsappClient['loadedCommands'], commandName)
        })
      })

      Reflect.deleteProperty(whatsappClient['loadedModules'], name)
    }
  }
}

const parseArgs = (messageContent: string): string[] => {
  if (!messageContent) return []
  return messageContent.split(' ')
}

const runCommand = async (message: Message, command: Command, args: string[], groupNotification?: GroupNotification) => {
  /*if (command.cooldown != null) {
    await client['userData'].ensure(`${message.author.id}.cooldowns.${command.name}`, new Date(0))
    const cooldownExpiryDate = new Date(client['userData']
      .get(`${message.author.id}.cooldowns.${command.name}`))
    if (cooldownExpiryDate.getTime() > message.createdTimestamp) {
      return message.channel.send(
        `This command has a cooldown of ${command.cooldown} seconds.`
        + `(${new Date(+cooldownExpiryDate - Date.now()).getSeconds() + 1} left)`)
    }
    await client['userData'].set(`${message.author.id}.cooldowns.${command.name}`,
      new Date(message.createdTimestamp + command.cooldown * 1000))
  }
   */
  if(message !== mockMessage){
    await log.info({message: `Chat: ${message.from} - Author: ${message.author} - Content: ${message.body}`})
  }

  if (args.length > command.maxArgs) {
    return message.reply(
      `Too many arguments for \`${command.name}\`. (max: ${command.maxArgs}, `
      + `you might need to quote an argument) `, message.from)
  }
  if (args.length < command.minArgs) {
    return message.reply(`Too few arguments for \`${command.name}\`. (min: ${command.minArgs})`, message.from)
  }
  try {
    if (command.adminOnly && ownerId !== message.author && ownerId !== message.from) {
      return message.reply(`You don't have permission to execute this command, which requires ownership of this bot.`, message.from)
    }
    return await command.run(message, client, args, telegram!, groupNotification)
  } catch (e) {
    await message.reply(`Error: \`${e}\``, message.from)
    return log.warn({ message:`\`${command.name} ${args}\` errored with \`${e}\``, client: client, telegramBot: telegram!})
  }
}

client.on(Events.READY, async () => {
  log.info({ message:`Client is ready! Logged in as: Name: ${client.info.pushname} - WhatsApp ID: ${client.info.wid.user}`, client: client, telegramBot: telegram!})

  if (whatsappClient.loadedModules.size > 0) {
    savedModules.push(...whatsappClient.loadedModules.keys())
  }

  fs.readdir('./modules/', (err, files) => {
    if (err) {
      return log.error({ message:'Failed to load modules folder', client: client, telegramBot: telegram!})
    } else {
      let loadedModulesText = "Loaded modules:\n\n"

      files.forEach(async file => {
        const name = file.split('.')[0]
        availableModules.push(name)
        loadModule(name, true)

        loadedModulesText += `${name}\n`
      })

      log.info({ message: loadedModulesText, client: client, telegramBot: telegram!})
    }
  })

  log.info({ message:`Client is ready! Name: ${client.info.pushname} - WhatsApp ID: ${client.info.wid.user}`, telegramBot: telegram!})
})

const defaultCommand: Command = {
  name: 'default',
  description: 'DefaultCommand',
  examples: ['yes'],
  adminOnly: false,
  minArgs: 1,
  maxArgs: Infinity,
  signature: 'DefaultCommand',
  run: async (message: Message, client: Client, args: string[]) => {
    let out = args.join(' ')
    try {
      return await message.reply(out)
    } catch (e: any) {
      if (e.message === 'Cannot send an empty message') {
        return message.reply('\u200e')
      } else {
        throw e
      }
    }
  }
}

client.on(Events.MESSAGE_RECEIVED, async (message: Message) => {
  //console.log(message)
  if (!whatsappClient.prefixes.has(message.from)) {
    whatsappClient.prefixes.set(message.from, '!')
  }

  // TODO: get prefix
  // const prefix: string = whatsappClient.prefixes.get(message.from) ?? '';
  const prefix = '!'
  if (message.body.startsWith(`${prefix}`)) {
    const commandName: string = message.body.split(prefix)[1].split(' ')[0].toLowerCase()
    if (whatsappClient.loadedCommands.has(commandName)) {
      const commandArgs: string = message.body.substr(prefix.length + 1 + commandName.length)
      await runCommand(message, whatsappClient.loadedCommands.get(commandName) ?? defaultCommand, parseArgs(commandArgs))
    } else {
      await message.reply(`The command *${commandName}* doesn't exist`, message.from)
    }
  }
  else{
    if (message.hasQuotedMsg) {
      const quotedMsg = await message.getQuotedMessage()

      // Is answering to a poll message
      if (quotedMsg.fromMe) {
        // Is answering to a poll option message
        if (quotedMsg.type === MessageTypes.TEXT && quotedMsg.body.toLowerCase().startsWith("!encuesta")) {
          let pollIdText = quotedMsg.body.slice(
            quotedMsg.body.indexOf('|') + 1,
            quotedMsg.body.lastIndexOf('|'),
          )

          const pollId = Number(pollIdText);

          if(isNaN(pollId)) {
            return await message.reply(`Error al recuperar la encuesta ${pollIdText}`)
          }

          await runCommand(message, whatsappClient.loadedCommands.get("add-option") ?? defaultCommand, [pollId.toString(), quotedMsg.id._serialized, message.body])

        }
        else if (quotedMsg.type === MessageTypes.LIST) { // Is voting
          // @ts-ignore
          const list = quotedMsg.rawData.list as List

          if (!list.title!.toLowerCase().startsWith("!encuesta"))
          {
            return await message.reply("Conteste a una encuesta válida")
          }

          let pollIdText = list.title!.slice(
            list.title!.indexOf('|') + 1,
            list.title!.lastIndexOf('|'),
          )

          const pollId = Number(pollIdText);

          if(isNaN(pollId)) {
            return await message.reply(`Error al recuperar la encuesta ${pollIdText}`)
          }

          const optionIdText = message.body.split("\n")[0]

          const optionId = Number(optionIdText)

          if(isNaN(optionId)) {
            return await message.reply(`Error al recuperar la opción ${optionIdText}`)
          }

          await runCommand(message, whatsappClient.loadedCommands.get("vote") ?? defaultCommand, [optionId.toString() ,pollId.toString()])
        }
      }
    }
  }
})

// client.on(Events.MESSAGE_CREATE, async (message: Message) => {
//   if (!whatsappClient.prefixes.has(message.from)) {
//     whatsappClient.prefixes.set(message.from, '!')
//   }
//
//   // const prefix: string = 'test' + whatsappClient.prefixes.get(message.from) ?? '';
//   const prefix = '!'
//   if (message.author === ownerId || message.from === ownerId) {
//     if (message.body.startsWith(`${prefix}`)) {
//       const commandName: string = message.body.split(`${prefix}`)[1].split(' ')[0].toLowerCase()
//       if (whatsappClient.loadedCommands.has(commandName)) {
//         const commandArgs: string = message.body.substr(prefix.length + 1 + commandName.length)
//
//         const chat = await message.getChat()
//         const contact = await message.getContact()
//         if(chat.isGroup) {
//           message.author = contact.id.user + "@c.us"
//           message.from = chat.id.user + "@g.us"
//         }
//
//         await runCommand(message, whatsappClient.loadedCommands.get(commandName) ?? defaultCommand, parseArgs(commandArgs))
//       } else {
//         await message.reply(`The command *${commandName}* doesn't exist`, message.from)
//       }
//     }
//   }
// })

client.on(Events.DISCONNECTED, (state) => {
  log.warn({ message:`${state}`, telegramBot: telegram!})
  client.initialize()
})

client.on(Events.AUTHENTICATION_FAILURE, (state) => {
  log.warn({ message:`${state}`, telegramBot: telegram!})
  client.initialize()
})

client.on(Events.GROUP_JOIN, async (notification) => {
  await runCommand(mockMessage, whatsappClient.loadedCommands.get("user-joined") ?? defaultCommand, [], notification)
})

client.on(Events.GROUP_LEAVE, async (notification) => {
  await runCommand(mockMessage, whatsappClient.loadedCommands.get("user-leave") ?? defaultCommand, [], notification)
})

client.on(Events.GROUP_UPDATE, async (notification) => {
  await runCommand(mockMessage, whatsappClient.loadedCommands.get("group-update") ?? defaultCommand, [], notification)
})

client.on(Events.MESSAGE_REVOKED_EVERYONE, async (message) => {
  await runCommand(message, whatsappClient.loadedCommands.get("message-revoked") ?? defaultCommand, [])
})

export const getClientState = () => {
  return client.getState()
}

export const getClientInfo = () => {
  if (client) {
    return client.info
  }
  return null
}

export const getWWebVersion = () => {
  if (client) {
    return client.getWWebVersion()
  }
  return null
}

export const resetClient = () => {
  if (client) {
    return client.resetState()
  }
  return null
}

export const logout = () => {
  if (client) {
    return client.logout()
  }
  return null
}

export const initialize = () => {
  return client.initialize()
}

client.initialize()
