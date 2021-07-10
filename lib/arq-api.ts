import axios, { AxiosRequestConfig } from 'axios'

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
