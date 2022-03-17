'use strict'
import { Client } from 'whatsapp-web.js'
import { TelegramBotWrapper } from '../luciobot'

export interface LogParameters {
  message: string;
  client?: Client;
  telegramBot?: TelegramBotWrapper;
}

type Options = { type: string; } & LogParameters;


export const log = async (options: Options) => {
  console.log(`${options.type.toUpperCase()}: ${options.message}`)

  const messageContent = `${options.type.toUpperCase()}: ${options.message}`

  if (options.telegramBot && options.telegramBot.bot) {
    await options.telegramBot.bot.telegram.sendMessage(options.telegramBot.notificationsChannelId, messageContent)
  }

  if (options.client) {
    return await options.client.sendMessage(process.env.OWNER_WHATSAPP_ID ?? '', messageContent)
  }
}

export const info = (parameters: LogParameters) => {
  // tslint:disable-next-line
  return log({...{type: 'Info'}, ...parameters})
}

export const warn = (parameters: LogParameters) => {
  // tslint:disable-next-line
  return log({...{type: 'Warning'}, ...parameters})
}

export const error = (parameters: LogParameters) => {
  // tslint:disable-next-line
  return log({...{type: 'Error'}, ...parameters})
}
