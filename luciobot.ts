'use strict'

import {Client, ClientOptions, Events, GroupNotification, Message} from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as log from './lib/log'
import {mockMessage} from "./lib/mock-wa";

dotenv.config()

type ClientWrapper = {
  prefixes: Map<string, string>,
  loadedCommands: Map<string, Command>,
  loadedModules: Map<string, Module>,
  [key: string]: any
}

const clientOptions: ClientOptions = {
  puppeteer: {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}

const chromePath = process.env.CHROME_PATH ?? ''

if (chromePath !== '') {
  if (clientOptions.puppeteer) {
    clientOptions.puppeteer['executablePath'] = chromePath
  }
}

const sessionString = process.env.WA_SESSION ?? ''

if (sessionString !== '') {
  clientOptions.session = JSON.parse(sessionString)
}

const client = new Client(clientOptions)

export const whatsappClient: ClientWrapper = {
  loadedCommands: new Map<string, Command>(),
  loadedModules: new Map<string, Module>(),
  prefixes: new Map<string, string>() // TODO: get from DB
}

whatsappClient['client'] = client

whatsappClient['log'] = log

if (!process.env.OWNER_WHATSAPP_ID) {
  log.error('No owner user WhatsApp ID supplied. Set the OWNER_WHATSAPP_ID environment variable.')
}

const ownerId = process.env.OWNER_WHATSAPP_ID ?? ''

client.on(Events.QR_RECEIVED, (qr) => {
  qrcode.generate(qr, { small: true })
  log.info('Scan the QR Code to start the whatsapp web client.')
})

client.on(Events.AUTHENTICATED, (session) => {
  log.info('Copy the value below without line breaks and set it to WA_SESSION environment variable.\n' +
    `'${JSON.stringify(session)}'`)
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
  run (message: Message, client: Client, args: string[], groupNotification?: GroupNotification): Promise<Message | undefined>
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

    log.info(`Loading module ${name}`, client)

    saveModule(module)

    if (module.jobs) {
      module.jobs.map((x: Job) => {
        x.interval = setInterval(() => x.job(client), x.period * 1000)
        if (x.runInstantly) {
          x.job(client)
            .catch(log.warn)
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
  }).catch(err => log.warn(err, client))
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
    await log.info(`Chat: ${message.from} - Author: ${message.author} - Content: ${message.body}`)
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
    return await command.run(message, client, args, groupNotification)
  } catch (e) {
    await message.reply(`Error: \`${e}\``, message.from)
    return log.warn(`\`${command.name} ${args}\` errored with \`${e}\``, client)
  }
}

client.on(Events.READY, async () => {
  log.info(`Client is ready! Logged in as: Name: ${client.info.pushname} - WhatsApp ID: ${client.info.wid.user}`, client)

  if (whatsappClient.loadedModules.size > 0) {
    savedModules.push(...whatsappClient.loadedModules.keys())
  }

  fs.readdir('./modules/', (err, files) => {
    if (err) {
      return log.error('Failed to load modules folder', client)
    } else {
      files.forEach(async file => {
        const name = file.split('.')[0]
        availableModules.push(name)
        loadModule(name, true)
      })
    }
  })

  console.log(`Client is ready! Name: ${client.info.pushname} - WhatsApp ID: ${client.info.wid.user}`)
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
    } catch (e) {
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
})

client.on(Events.MESSAGE_CREATE, async (message: Message) => {
  if (!whatsappClient.prefixes.has(message.from)) {
    whatsappClient.prefixes.set(message.from, '!')
  }

  // const prefix: string = 'test' + whatsappClient.prefixes.get(message.from) ?? '';
  const prefix = '!'
  if (message.author === ownerId || message.from === ownerId) {
    if (message.body.startsWith(`${prefix}`)) {
      const commandName: string = message.body.split(`${prefix}`)[1].split(' ')[0].toLowerCase()
      if (whatsappClient.loadedCommands.has(commandName)) {
        const commandArgs: string = message.body.substr(prefix.length + 1 + commandName.length)

        const chat = await message.getChat()
        const contact = await message.getContact()
        if(chat.isGroup) {
          message.author = contact.id.user + "@c.us"
          message.from = chat.id.user + "@g.us"
        }

        await runCommand(message, whatsappClient.loadedCommands.get(commandName) ?? defaultCommand, parseArgs(commandArgs))
      } else {
        await message.reply(`The command *${commandName}* doesn't exist`, message.from)
      }
    }
  }
})

client.on(Events.DISCONNECTED, (state) => {
  log.warn(`${state}`)
})

client.on(Events.AUTHENTICATION_FAILURE, (state) => {
  log.warn(`${state}`)
})

client.on(Events.BATTERY_CHANGED, (batteryInfo) => {
  if (batteryInfo.battery < 15 && !batteryInfo.plugged) {
    log.warn(`Low battery level: ${batteryInfo.battery}%`)
  }
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

client.initialize()
