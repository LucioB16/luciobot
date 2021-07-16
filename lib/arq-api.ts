'use strict'

import axios, { AxiosRequestConfig } from 'axios'
import { YtResponse } from 'youtube-dl-exec'

const youtubedl = require('youtube-dl-exec')

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
      const buffer = Buffer.from(((await axios.get(audioUrl, { responseType: 'arraybuffer' })).data))

      if (buffer.byteLength > 104857600) {
        return { status: false, msg: 'File size exceeds limit.\n\n*Direct download link:*\n```👉 ' + audioUrl + '```'}
      }

      const audio = buffer.toString('base64');

      return {status: true, audio: audio, filename: name}
    }
  } catch(e) {
    return {status: false, msg: `Failed to download audio for https://youtube.com/watch?v=${id}`}
  }
}

export type YtVideoResult = {
  status: boolean,
  msg?: string,
  video?: string,
  mimetype?: string
}

export async function downloadYoutubeVideo(id: string) : Promise<YtVideoResult> {
  let result: YtVideoResult = { status: false, msg: `Failed to download video for https://youtube.com/watch?v=${id}` }

  const output: YtResponse = await youtubedl('https://youtube.com/watch?v=' + id, {
    dumpSingleJson: true,
    noWarnings: true,
    noCallHome: true,
    noCheckCertificate: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
    referer: 'https://youtube.com/watch?v=' + id
  })

  for (const format of output.formats) {
    if(format.filesize < 104857600 &&
      format.acodec !== "none" &&
      format.ext === "mp4" &&
      format.height >= 360) {
      let video = Buffer.from((await axios.get(format.url, { responseType: 'arraybuffer' })).data).toString('base64');

      return  { status: true, video: video, mimetype: 'video/mp4' }
    }
  }

  return result
}
