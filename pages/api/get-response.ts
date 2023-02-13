import type { NextApiRequest, NextApiResponse } from 'next'
import {generatePrompt} from 'prompts';
import { query, OpenAIModel } from '../../proxies/openai';

type Data = {
    response: string
}



const addConversation = (promptPrefix: string, conversation: Array<string>, modelName: string, humanName: string) => {
    let conversationStr = ''
    for(let i=0; i < conversation.length; i+=2) {
        if (i == conversation.length-1) {
            conversationStr += `\n${humanName}: ${conversation[i]}\n${modelName}: `
        } else {
            conversationStr += `\n${humanName}: ${conversation[i]}\n${modelName}: ${conversation[i+1].replace(modelName+': ', '')} `
        }
    }

    return promptPrefix.replace('__CONVERSATION__', conversationStr)
}

const cleanResponse = (response: string, modelName: string, humanName: string) => {
    humanName = `${humanName}: `
    modelName = `${modelName}: `
    response = response.trim();
    if(response.indexOf(humanName) == 0) {
        // the robot has chosen to play act as the human first, so its answer won't make sense if we just extract that... 
        // bit of a failure state here 🤷‍♂️
        response = response.replace(humanName, '')
        if(response.indexOf(modelName)) {
            return response.split(humanName)[0];
        }
    }
    if(response.indexOf(modelName) > -1) {
        // it's likely to put its own name in unnecessarily, so just take it out
        response.replace(modelName, '')
    }
    if(response.indexOf(humanName) > -1) {
        // if it then responds as the human, just take that out
        response = response.split(humanName)[0];
    }
    return response
}

const lookupModel = (selectedModel: string) => {
    switch (selectedModel) {
        case 'ada':
            return OpenAIModel.ada;
        case 'curie':
            return OpenAIModel.curie;
        case 'davinci':
            return OpenAIModel.davinci;
        case 'biogpt':
        default:
            return OpenAIModel.curie;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
  ) {
    const humanName = "Human A"
    const selectedModel = lookupModel(req.body.currentModel);
    const {promptPrefix, modelName} = generatePrompt(humanName, req.body.currentMood);
    const fullPrompt = addConversation(promptPrefix, req.body.conversation, modelName, humanName);
    let chatResponse = await query(fullPrompt, selectedModel);
    console.log("beginning of prompt:", fullPrompt.slice(0,200), "...")
    console.log("full response:", chatResponse);
    chatResponse = cleanResponse(chatResponse, modelName, humanName)
    console.log("cleaned response:", chatResponse);
    res.status(200).json({ response: chatResponse })
  }
