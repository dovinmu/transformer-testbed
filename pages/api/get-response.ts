import { clear } from 'console';
import type { NextApiRequest, NextApiResponse } from 'next'
import * as prompts from 'prompts';
import query from '../proxies/openai';

type Data = {
    response: string
}

const generateBingPrompt = (modelName: string, humanName: string, context: string='', location: string="Redmond, Washington, United States", 
    mood="normal") => {
    /**
    prepares all context for a Bing-like prompt, except for the actual conversation.
    placeholders in context:
    * Here are conversations between a human and Sydney.
    * Human A
    __CONTEXT__
    * Time at the start of this conversation is __DATE_TIME__. The user is located in
    __LOCATION__.
    * Conversation of Human A with Sydney given the context
    __CONVERSATION__
     */
    
    let bing_prompt = ''
    switch(mood) {
        case 'normal':
            bing_prompt = prompts.BING_NORMAL;
            break;
        case 'stoned':
            bing_prompt = prompts.BING_STONED;
            break;
        case 'cyberpunk':
            throw Error(`mood ${mood} not recognized`)
        case 'tripping':
            throw Error(`mood ${mood} not recognized`)
        default:
            throw Error(`mood ${mood} not recognized`)
    }

    let promptPrefix = bing_prompt.replace('__CONTEXT__', context)
    promptPrefix = promptPrefix.replace('__DATE_TIME__', 'Sun, 12 Feb 2023 12:40:49 EST') // todo
    promptPrefix = promptPrefix.replace('__LOCATION__', location)
    promptPrefix = promptPrefix.replace('__MODEL_NAME__', modelName)
    promptPrefix = promptPrefix.replace('__HUMAN_NAME__', humanName)

    return promptPrefix
};

const generateSimplePrompt = (modelName: string, humanName: string) => {
    let prefixPrompt = `
Consider the chatbot __MODEL_NAME__. __MODEL_NAME__ responds to the human like this.
__MODEL_NAME__ does not respond as the human, only as __MODEL_NAME__.

Here is a conversation between a human and __MODEL_NAME__. What does __MODEL_NAME__ say next?

__CONVERSATION__`.replaceAll('__MODEL_NAME__', modelName);
    prefixPrompt = prefixPrompt.replaceAll('__HUMAN_NAME__', humanName)
    return prefixPrompt;
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
    response = response.trim();
    if(response.indexOf(humanName) == 0) {
        // the robot has chosen to play act as the human first, so its answer won't make sense if we just extract that... 
        // bit of a failure state here 🤷‍♂️
        return response
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
  ) {
    const modelName = "ChatGPT"
    const humanName = "Human A"
    const conversation = req.body.conversation
    console.log(req.body)
    // const promptPrefix = generateBingPrompt(modelName, humanName);
    const promptPrefix = generateSimplePrompt(modelName, humanName);
    const fullPrompt = addConversation(promptPrefix, req.body.conversation, modelName, humanName);
    console.log(fullPrompt)
    let chatResponse = await query(fullPrompt);
    chatResponse = cleanResponse(chatResponse, modelName, humanName)
    console.log(chatResponse);
    res.status(200).json({ response: chatResponse })
  }
