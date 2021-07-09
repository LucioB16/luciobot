'use strict'
import {Client} from 'whatsapp-web.js'

type Options = {
  type: string,
  message: string,
  client?: Client,
}

export const log = async (options: Options) => {
  console.log(`${options.type.toUpperCase()}: ${options.message}`);
  if (options.client) {
    return await options.client.sendMessage(process.env.OWNER_WHATSAPP_ID ?? '',
      `${options.type.toUpperCase()}: ${options.message}`);
  }
}

export const info = (message: string, client?: Client) => {
  // tslint:disable-next-line
  return log({type: 'Info', message, client})
}

export const warn = (message: string, client?: Client) => {
  // tslint:disable-next-line
  return log({type: 'Warning', message, client})
}

export const error = (message: string, client?: Client) => {
  // tslint:disable-next-line
  return log({type: 'Error', message, client})
}