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

enum OpenAIModel {
    ada, babbage, curie, davinci
}



const MAX_TOKENS = 500;
const TEMP = 1.0;

const getOpenAIModel = (model: OpenAIModel):string => {
    switch(model) {
        case OpenAIModel.ada:
            return 'text-ada-001';
        case OpenAIModel.babbage:
            return 'text-babbage-001';
        case OpenAIModel.curie:
            return 'text-curie-001';
        case OpenAIModel.davinci:
            return 'text-davinci-003';
        default:
            return 'text-ada-001';
    }
}

async function query(prompt: string, model: OpenAIModel) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
    const modelId = getOpenAIModel(model);
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