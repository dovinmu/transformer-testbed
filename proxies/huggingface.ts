
const HuggingFaceModel = {
    // biogpt: "microsoft/biogpt",
    biogpt: "microsoft/BioGPT-Large",
    gpt2: "gpt2",
    bigscience_bloom: "bigscience/bloom-560m"
}

const ENDPOINT = 'https://api-inference.huggingface.co/models/'


async function query(prompt: string, model: string) {
    const url = ENDPOINT + model;
    const headers = {"Authorization": `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`}
    const data = prompt;
    const response = await fetch(url, {
        method: "POST", 
        headers: headers, 
        body: JSON.stringify(data)
    })
    const json = await response.json();
    console.log({json});
    if(json.error) {
        return json.error;
    }
    try {
        return json[0].generated_text
    } catch(err) {
        console.log(err);
        throw Error(JSON.stringify(err));
    }
}

export {
    query, HuggingFaceModel
}

