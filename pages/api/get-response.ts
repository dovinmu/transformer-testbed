import type { NextApiRequest, NextApiResponse } from 'next'
import {generatePrompt} from 'prompts';
import { query as queryOpenAI, OpenAIModel } from '@/proxies/openai';
import { query as queryHuggingFace, HuggingFaceModel } from '@/proxies/huggingface';

type Data = {
    response: string
}

const MAX_TOKENS = 500;

const modelMaxLength = (model: string) => {
    // very imperfect because this is just counting characters not tokens, but we'll make do
    // according to OpenAI, 1 token ~= 4 chars in English (https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them)
    switch(model) {
        case OpenAIModel.ada:
        case OpenAIModel.curie:
            return (2048 - MAX_TOKENS) * 3.5;
        case OpenAIModel.davinci:
            return (4000 - MAX_TOKENS) * 3.5;
        default:
            return (2048 - MAX_TOKENS) * 3.5;
    }
}

// this makes the assumption that the human will always go first, which is debatable
const addConversation = (promptPrefix: string, conversation: Array<string>, modelName: string, humanName: string) => {
    let conversationStr = ''
    conversation = conversation.map((chat:string, i:number) => {
        return `\n${i % 2 == 0 ? humanName : modelName}: ${chat}` // map to format "Human: <something>\nRobot: <something>"
    })
    for(let i=conversation.length-1; i >= 0; i-=1) {
        console.log(promptPrefix.length + conversationStr.length, conversation[i].slice(0, 80))
        if (promptPrefix.length + conversationStr.length + conversation[i].length > modelMaxLength(modelName)) {
            console.log("~~~ dropping some chats ~~~")
            break;
        }
        conversationStr = conversation[i] + conversationStr;
    }
    return promptPrefix.replace('__CONVERSATION__', conversationStr)
}

const cleanResponse = (response: string, modelName: string, humanName: string) => {
    humanName = `${humanName}: `
    modelName = `${modelName}: `
    response = response.trim();
    console.log({humanName, modelName})

    if(response.indexOf(humanName) == 0) {
        // the robot has chosen to play act as the human first, so its answer won't make sense if we just extract that... 
        // bit of a failure state here since it's responding as the human but 🤷‍♂️
        response = response.replace(humanName, '')
        if(response.indexOf(modelName) > -1) {
            return response.split(humanName)[0];
        }
    }
    if(response.indexOf(modelName) > -1) {
        // it's likely to put its own name in unnecessarily, so just take it out
        response = response.replace(modelName, '')
    }
    if(response.indexOf(humanName) > -1) {
        // if it then responds as the human, just take that out
        response = response.split(humanName)[0];
    }
    return response
}

const query = (fullPrompt: string, selectedModel: string) => {
    if(Object.values(OpenAIModel).includes(selectedModel)) {
        return queryOpenAI(fullPrompt, selectedModel, MAX_TOKENS);
    } else if(Object.values(HuggingFaceModel).includes(selectedModel)) {
        return queryHuggingFace(fullPrompt, selectedModel);
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data | { error: any}>
  ) {
    console.log("==========")
    const selectedModel = req.body.currentModel;
    let fullPrompt, modelNameOverscope, humanNameOverscope; // kind of a weird scoping problem I admit, should refactor this
    try {
        const {promptPrefix, modelName, humanName} = generatePrompt(req.body.currentPrompt);
        modelNameOverscope = modelName;
        humanNameOverscope = humanName;
        fullPrompt = addConversation(promptPrefix, req.body.conversation, modelName, humanName);
    } catch(err) {
        console.log(err);
        return res.status(500).json({ error: err })
    }
    let chatResponse;
    try{
        chatResponse = await query(fullPrompt, selectedModel);
    } catch(err) {
        console.log(err);
        return res.status(500).json({ error: err })
    }
    console.log(selectedModel);
    console.log("beginning of prompt:", fullPrompt.slice(0,100), "...")
    console.log("full response:", chatResponse);

    if(!chatResponse) {
        return res.status(200).json({ response: "<🤷‍♂️ no response...>"});
    }
    chatResponse = cleanResponse(chatResponse, modelNameOverscope, humanNameOverscope);
    console.log("cleaned response:", chatResponse);
    return res.status(200).json({ response: chatResponse })
}
