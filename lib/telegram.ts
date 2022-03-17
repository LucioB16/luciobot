import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import * as log from './log'

export const startBot = async (token: string) : Promise<Telegraf<Context<Update>>> => {
  await log.info({message: 'Starting Telegram bot'})

  const bot: Telegraf<Context<Update>> = new Telegraf(token);

  await log.info({message: 'Telegram bot object created'})

  bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
  });

  bot.help((ctx) => {
    ctx.reply('Send /start to receive a greeting');
    ctx.reply('Send /quit to stop the bot');
  });

  bot.command('quit', (ctx) => {
    // Explicit usage
    ctx.telegram.leaveChat(ctx.message.chat.id);
    // Context shortcut
    ctx.leaveChat();
  });

  bot.on('text', (ctx) => {
    ctx.reply(
      'You choose the ' +
      (ctx.message.text === 'first' ? 'First' : 'Second') +
      ' Option!'
    );
  });

  await log.info({message: 'Telegram bot events registered'})

  await bot.launch()

  await log.info({message: 'Telegram bot launched'})

  return bot
}