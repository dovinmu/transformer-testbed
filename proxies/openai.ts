const OpenAIModel = {
    ada: 'text-ada-001', 
    babbage: 'text-babbage-001', 
    curie: 'text-curie-001', 
    davinci: 'text-davinci-003',
    gpt35: 'gpt-3.5-turbo',
    gpt4: 'gpt-4'
}

const TEMP = 1.0;

function isChatModel(model: string) {
    return 'gpt-4, gpt-4-0314, gpt-4-32k, gpt-4-32k-0314, gpt-3.5-turbo, gpt-3.5-turbo-0301'.split(', ').indexOf(model) !== -1;
}

async function queryChat(conversation: Array<string>, system: string, modelId: string, tokens: number) {
    console.log(`querying ${modelId} with chat endpoint`)
    const prompt =  { "messages": conversation.map((msg,idx) => { return { "role": idx%2==0?"user":"assistant", "content": msg }}) }
    if(system !== '') {
        prompt.messages = [{ "role": "system", "content": system }].concat(prompt.messages);
    }
    console.log({prompt});
    const data = {
        "model": modelId, ...prompt,
        "temperature": TEMP, 
        "max_tokens": tokens
    }
    const json = await _query('https://api.openai.com/v1/chat/completions', data);
    console.log(json);
    try {
        console.log(json.choices[0])
        return json.choices[0].message.content;
    } catch(err) {
        console.log(json);
        throw new Error(json.error.message);
    }
}

async function query(prompt: string, modelId: string, tokens: number) {
    console.log(`querying ${modelId}`)
    const data = {"model": modelId, "prompt": prompt, "temperature": TEMP, "max_tokens": tokens};
    const json = await _query('https://api.openai.com/v1/completions', data);
    try {
        return json.choices[0].text;
    } catch(err) {
        console.log(json);
        throw new Error(json.error.message);
    }
};

async function _query(endpoint: string, data: Object) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
    const response = await fetch(endpoint, {
        method: "POST",
        headers: headers, 
        body: JSON.stringify(data) 
    })
    return await response.json();
}

export {
    query, queryChat, isChatModel, OpenAIModel
}
