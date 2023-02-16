import type { NextApiRequest, NextApiResponse } from 'next'
import {generatePrompt} from 'prompts';
import { query as queryOpenAI, OpenAIModel } from '@/proxies/openai';
import { query as queryHuggingFace, HuggingFaceModel } from '@/proxies/huggingface';

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
    // first check if the model repeated our query back verbatim
    // if(response.indexOf())

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
        response.replace(modelName, '')
    }
    if(response.indexOf(humanName) > -1) {
        // if it then responds as the human, just take that out
        response = response.split(humanName)[0];
    }
    return response
}

const query = (fullPrompt: string, selectedModel: string) => {
    if(Object.values(OpenAIModel).includes(selectedModel)) {
        return queryOpenAI(fullPrompt, selectedModel);
    } else if(Object.values(HuggingFaceModel).includes(selectedModel)) {
        return queryHuggingFace(fullPrompt, selectedModel);
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data | { error: any}>
  ) {
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
    console.log("beginning of prompt:", fullPrompt.slice(0,1000), "...")
    console.log("full response:", chatResponse);
    if(!chatResponse) {
        return res.status(200).json({ response: "<🤷‍♂️ no response...>"});
    }
    chatResponse = cleanResponse(chatResponse, modelNameOverscope, humanNameOverscope);
    console.log("cleaned response:", chatResponse);
    return res.status(200).json({ response: chatResponse })
}
