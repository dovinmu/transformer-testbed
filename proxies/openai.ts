import { ContentLengthExceededError } from "@/errors";

type OAIResponseOption  = {
    text: string;
}
type GenerateResponse = {
    choices: Array<OAIResponseOption>;
}

type APIError = {
    error: { message: string, type: string }
}

const OpenAIModel = {
    ada: 'text-ada-001', 
    babbage: 'text-babbage-001', 
    curie: 'text-curie-001', 
    davinci: 'text-davinci-003',
    davinci_instruct: 'TODO'
}

const MAX_TOKENS = 500;
const TEMP = 1.0;


async function query(prompt: string, modelId: string) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
    console.log(`querying ${modelId}`)
    const data = {"model": modelId, "prompt": prompt, "temperature": TEMP, "max_tokens": MAX_TOKENS};
    const response = await fetch('https://api.openai.com/v1/completions', {
        method: "POST",
        headers: headers, 
        body: JSON.stringify(data) 
    })
    const json = await response.json();
    try {
        return json.choices[0].text;
    } catch(err) {
        console.log(json);
        throw new ContentLengthExceededError(json.error.message);
    }
};

export {
    query, OpenAIModel
}
