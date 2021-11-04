import { Client, Message, Buttons, List } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'

export const name = 'poll'
export const commands: Command[] = [
  {
    name: 'poll',
    secret: false,
    description: 'Makes a poll',
    examples: ['poll 3'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 0,
    maxArgs: Infinity,
    signature: 'poll <number>',
    run: async (message: Message, client: Client, args: string[]) => {
      const number = Number(args.join(" "))

      try {
        // let buttonArray = []
        //
        // for (let i = 1; i <= number; i++) {
        //   let button = ["body", `Boton ${i}`, "aaaaaaa"]
        //   buttonArray.push(button)
        // }
        //
        // const buttons = new Buttons('*Seleccione una opción:*', buttonArray , 'Título', 'Pie')
        // let msg = await client.sendMessage(message.from, buttons)
        // console.log(msg)

        let sections = [{title:'Encuesta',rows:[{id: '1', title:'Si', description: 'Descripción'},{id: '2', title:'No', description: 'Descripción'}]}];
        let list = new List('Si o no?','Elegí una opción',sections,'Encuesta','footer');
        let msj = client.sendMessage(message.from, list);
        console.log(msj)

        return msj;
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]