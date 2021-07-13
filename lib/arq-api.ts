'use strict'

import axios, { AxiosRequestConfig } from 'axios'
import * as tmp from 'tmp'
import * as fs from 'fs'
import {FfmpegCommand} from "fluent-ffmpeg";
import { v4 as uuidv4 } from 'uuid';

const ffmpeg = require('fluent-ffmpeg');

const runningCommands: Map<string, FfmpegCommand> = new Map<string, FfmpegCommand>()
function generateID() {
  return uuidv4().toString();
}

export type YoutubeResult = {
  id: string,
  thumbnails: string[],
  title: string,
  long_desc?: string,
  channel: string,
  duration: string,
  views: string,
  publish_time: string,
  url_suffix: string
}

export type ArqYTResult = {
  ok: boolean,
  result: YoutubeResult[]
}

export const searchYoutube = async (query: string) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    headers: {
      'X-API-KEY': process.env.ARQ_API_KEY ?? ''
    }
  }

  try {
    const response = await axios.get<ArqYTResult>(`https://thearq.tech/youtube?query=${query}`, config)
    return response.data
  } catch (e) {
    let errorResponse: ArqYTResult = {
      ok: false,
      result: []
    }
    return errorResponse
  }
}

export type YtAudioResult = {
  status: boolean,
  msg?: string,
  audio?: string,
  filename?: string
}

export const getYtAudio = async (id: string): Promise<YtAudioResult> => {
  const res = await axios.get(`https://www.yt-download.org/api/widget/mp3/${id}`);
  const data = res.data.split(`<a href="https://www.yt-download.org/download/${id}/mp3/256`)[1].split('</a>')[0];
  const size = data.split('<div class="text-shadow-1">').pop().split('</div>')[0];
  const audioUrl = `https://www.yt-download.org/download/${id}/mp3/256` + data.split('" ')[0];
  try{
    if(size.split(' ')[1] == 'MB' && parseInt(size.split(' ')[0]) > 100){
      return {status: false, msg: 'File size exceeds limit.\n\n*Direct download link:*\n```👉 ' + audioUrl + '```'}
    } else {
      const name = res.data.split('<h2 class="text-lg text-teal-600 font-bold m-2 text-center">')[1].split('</h2>')[0]
      const audio = Buffer.from(((await axios.get(audioUrl, { responseType: 'arraybuffer' })).data)).toString('base64');
      return {status: true, audio: audio, filename: name}
    }
  } catch(e) {
    return {status: false, msg: 'Failed to download audio. Make sure yt link is correct.'}
  }
}

export type YtVideoResult = {
  status: boolean,
  msg?: string,
  video?: string,
  filename?: string,
  mimetype?: string
}

export const getYtVideo = async (id: string): Promise<YtVideoResult> => {
  const res = await axios.get(`https://www.yt-download.org/api/widget/merged/${id}`);
  const data: string[] = res.data.split(`<a href="https://www.yt-download.org/download/${id}/merged`);
  data.shift();
  const name = res.data.split('<h2 class="text-lg text-teal-600 font-bold m-2 text-center">')[1].split('</h2>')[0];
  let urls = '';
  let urlsMap: Map<string, string> = new Map<string, string>()
  data.map(getUrls)

  function getUrls(vid: string) {
    let format = `${vid.split('<div class="text-shadow-1">')[1].split('</div>')[0].trim()} ${vid.split('<div class="text-xl font-bold text-shadow-1 uppercase">')[1].split('</div>')[0]}`
    let url = `https://www.yt-download.org/download/${id}/merged${vid.split('</a>')[0].split('" ')[0]}`
    urlsMap.set(format, url)
    urls += `\n${format} - ${url}\n`
    return urls
  }

  function getInfo(){
    try{
      let d = data.find(x =>
        parseInt(x.split('</a>')[0].split('<div class="text-shadow-1">')[1].split('</div>')[0].trim()) <= 720 &&
        parseInt((x.split('</a>')[0].split('<div class="text-shadow-1">').pop()??'').split('</div>')[0].trim()) <= 50
      );
      const size = (d?.split('<div class="text-shadow-1">').pop()??'').split('</div>')[0].trim()
      const url = `https://www.yt-download.org/download/${id}/merged${d?.split('</a>')[0].split('" ')[0]}`;
      return {status: 'found', size, url}
    }catch(e) {
      return {status: 'not found'}
    }
  }

  try{
    const info = getInfo();
    if(info.status == 'found'){
      const video = Buffer.from(((await axios.get(info.url ?? '', { responseType: 'arraybuffer' })).data)).toString('base64') ?? '';
      if (video !== ''){
        return {status: true, video: video, filename: name, mimetype: "video/mkv"}
      }
      else{
        return await downloadUrls();
      }
    } else{
      return await downloadUrls();
    }
  } catch(e) {
    return await downloadUrls();
  }

  async function downloadUrls(){
    try {
      for (const [sizeFormat, url] of urlsMap.entries()) {

        let [size, format] = sizeFormat.split(" ")

        size = size.substr(0, size.length-1)

        let response = await axios.get(url, { responseType: 'arraybuffer' })

        const downloadBuffer: Buffer = Buffer.from((response.data));

        const video = format === 'webm' ? await convertToMp4(downloadBuffer, format, size) : '';

        if (video != undefined && video !== ''){
          return {status: true, video: video, filename: name, mimetype: "video/mp4"}
        }
      }
      return {status: true, msg: urls}
    }
    catch (e) {
      return {status: true, msg: urls}
    }
  }

  async function convertToMp4(buffer: Buffer, format: string, size: string): Promise<string> {
    if (Buffer.byteLength(buffer) > 104857600) {
      return ''
    }

    const tmpInput = tmp.fileSync()

    fs.writeSync(tmpInput.fd, buffer, 0, buffer.length, 0)

    const tmpOutput = tmp.fileSync()

    const ffmpegPath = (process.env.FFMPEG_PATH ?? process.env.FFMPEG_CUSTOM_PATH) ?? ''

    const id = generateID();

    await new Promise((resolve, reject) =>{

      const command = ffmpeg()
        .setFfmpegPath(ffmpegPath)
        .input(tmpInput.name)
        .videoCodec("libx264")
        .saveToFile(tmpOutput.name)
        .videoBitrate("1000")
        .size(`${size}x?`)
        .format("mp4")
        .on("end", function() {
          resolve()
        })
        .on("error", function() {
          reject()
        })
        .run()
      runningCommands.set(id, command)
    })

    const output = fs.readFileSync(tmpOutput.name, 'base64')

    tmpInput.removeCallback()
    tmpOutput.removeCallback()

    if ((runningCommands.has(id))) {
      runningCommands.get(id)?.kill('SIGKILL')
      runningCommands.delete(id)
    }

    return output
  }
}
