import axios from 'axios'

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

    return response.translatedText
}