import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import * as log from './log'
import { getClientInfo, getClientState, getWWebVersion, initialize, logout, resetClient } from '../luciobot'

export const startBot = async (token: string) : Promise<Telegraf<Context<Update>>> => {
  await log.info({message: 'Starting Telegram bot'})

  const bot: Telegraf<Context<Update>> = new Telegraf(token);

  await log.info({message: 'Telegram bot object created'})

  const ownerId = Number(process.env.TELEGRAM_OWNER_ID as string)

  if (isNaN(ownerId)) {
    throw Error('TELEGRAM_OWNER_ID env variable is not correctly set')
  }

  bot.start((ctx) => {
    let text = 'Hello ' + ctx.from.first_name + '!'

    if(ctx.from.id !== ownerId) {
      text += 'You aren\'t the bot\'s owner, you won\'t be able to run any command'
    }

    ctx.reply(text)
  });

  bot.help((ctx) => {
    if(ctx.from.id !== ownerId) {
      ctx.reply('You aren\'t the bot\'s owner, you won\'t be able to run any command')
      return
    }

    let text = 'Send /start to receive a greeting\n'
    text +=  'Send /quit to stop the bot\n'
    text += 'Send /status to get the WhatsApp bot status\n'
    text += 'Send /reset to reset the WhatsApp bot\n'
    text += 'Send /logout to log out the WhatsApp bot\n'

    ctx.reply(text);
  });

  bot.command('quit', (ctx) => {
    // Explicit usage
    ctx.telegram.leaveChat(ctx.message.chat.id);
    // Context shortcut
    ctx.leaveChat();
  });

  bot.command('status', async (ctx) => {
    if(ctx.from.id !== ownerId) {
      ctx.reply('You aren\'t the bot\'s owner, you won\'t be able to run any command')
      return
    }

    const state = await getClientState()

    if (state === null) {
      ctx.reply('WhatsApp client not initialized')
      return
    }

    const info = getClientInfo()

    if (info === null) {
      ctx.reply('WhatsApp client not initialized')
      return
    }

    const wWebVersion = await getWWebVersion()

    if (wWebVersion === null) {
      ctx.reply('WhatsApp client not initialized')
      return
    }

    let text = `WhatsApp user: ${info.wid._serialized}\n` +
      `Pushname: ${info.pushname}\n` +
      `Platform: ${info.platform}\n`

    text += `WhatsApp Web version: ${wWebVersion}\n` +
      `WhatsApp client state: ${state.toString()}`

    ctx.reply(text)
  });

  bot.command('reset', async (ctx) => {
    if(ctx.from.id !== ownerId) {
      ctx.reply('You aren\'t the bot\'s owner, you won\'t be able to run any command')
      return
    }

    const resetResult = await resetClient()

    if (resetResult === null) {
      ctx.reply('WhatsApp client not initialized')
      return
    }

    ctx.reply('WhatsApp client reseted')
  });

  bot.command('logout', async (ctx) => {
    if(ctx.from.id !== ownerId) {
      ctx.reply('You aren\'t the bot\'s owner, you won\'t be able to run any command')
      return
    }

    const logoutResult = await logout()

    if (logoutResult === null) {
      ctx.reply('WhatsApp client not initialized')
    }

    ctx.reply('WhatsApp client logged out')

    try {
      await initialize()
    }
    catch (err) {
      ctx.reply(`Error starting WhatsApp client: ${JSON.stringify(err)}`)
      return
    }


    ctx.reply('WhatsApp initialized')

  });


  await log.info({message: 'Telegram bot events registered'})

  await bot.launch()

  await log.info({message: 'Telegram bot launched'})

  return bot
}