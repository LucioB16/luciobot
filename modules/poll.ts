import { Client, Message, Buttons, List } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'

export const name = 'poll'
export const commands: Command[] = [
  {
    name: 'poll',
    secret: false,
    description: 'Creates a new poll',
    examples: ['poll sale asado?'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'poll <question>',
    run: async (message: Message, client: Client, args: string[]) => {
      const question = args.join(" ")

      try {
        // TODO: Register poll in DB
        let sections = [{title:'Encuesta',rows:[{id: '1', title:'Si', description: 'Descripción'},{id: '2', title:'No', description: 'Descripción'}]}];
        let list = new List('Si o no?','Elegí una opción',sections,'Encuesta','footer');
        let msj = client.sendMessage(message.from, list);
        console.log(msj)

        return msj;
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  },
  {
    name: 'poll-option',
    secret: true,
    description: 'Registers a new option in a poll',
    examples: ['poll-option Si'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'poll <option>',
    run: async (message: Message, client: Client, args: string[]) => {
      // TODO: Get last option number in poll
      const option = "!option 1"
      const description = args.join(" ")

      try {
        // TODO: Register option in DB
        let sections = [{title:'Encuesta',rows:[{id: '1', title:'Si', description: 'Descripción'},{id: '2', title:'No', description: 'Descripción'}]}];
        let list = new List('Si o no?','Elegí una opción',sections,'Encuesta','footer');
        let msj = client.sendMessage(message.from, list);
        console.log(msj)

        return msj;
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  },
  {
    name: 'poll-publish',
    secret: true,
    description: 'Publishes a poll',
    examples: ['poll-publish'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: 1,
    signature: 'poll-publish',
    run: async (message: Message, client: Client, args: string[]) => {
      try {
        // TODO: get poll from DB and publish
        let sections = [{title:'Encuesta',rows:[{id: '1', title:'Si', description: 'Descripción'},{id: '2', title:'No', description: 'Descripción'}]}];
        let list = new List('Si o no?','Elegí una opción',sections,'Encuesta','footer');
        let msj = client.sendMessage(message.from, list);
        console.log(msj)

        return msj;
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  },
  {
    name: 'vote',
    secret: true,
    description: 'Selects an option from a poll',
    examples: ['!vote 1'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: 1,
    signature: '!option <option>',
    run: async (message: Message, client: Client, args: string[]) => {
      const option = args.join(" ")
      try {
        // TODO: check if user has voted and register vote in DB
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