type OAIResponseOption  = {
    text: string;
}
type GenerateResponse = {
    choices: Array<OAIResponseOption>;
}


export default async function query(prompt: string) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
    const data = {"model": "text-ada-001", "prompt": prompt, "temperature": 1, "max_tokens": 200};
    const response = await fetch('https://api.openai.com/v1/completions', {
        method: "POST",
        headers: headers, 
        body: JSON.stringify(data) 
    })
    const json = await response.json() as GenerateResponse;
    return json.choices[0].text;
};