import axios, { AxiosRequestConfig } from 'axios'

type LibreTranslateResponse = {
    translatedText?: string,
    error?: string
}

export const translate =
async (text: string, sourceLang: string, targetLang: string) : Promise<string> => {
    const config: AxiosRequestConfig = {
        method: 'post',
        headers: {
          'Content': 'application/json',
          'Accept': 'application/json',
        },
        responseType: 'json'
    }

    const body = {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
    }

    const response = await axios.post<LibreTranslateResponse>(
        "https://libretranslate.de/translate",
        body,
        config
    )

    if (response.status < 200 || response.status >= 300) {
      throw new Error("Error in translate request. " + response.data.error)
    }

    return response.data.translatedText ?? ""
}