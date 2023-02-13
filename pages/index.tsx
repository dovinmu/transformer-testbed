import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import React, {useState, useEffect } from 'react';

export default function Home() {
  const [conversation, setConversation] = useState<Array<string>>([]);
  const [chatboxDisabled, setChatboxDisabled] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('curie')
  const [currentMood, setCurrentMood] = useState<string>('chat')
  const [currentData, setCurrentData] = useState<string>('none')
  const [currentHumanEmoji, setCurrentHumanEmoji] = useState<string>('👨‍💻')
  const [currentRobotEmoji, setCurrentRobotEmoji] = useState<string>('🤖')

  useEffect(() => {
    if(response) {
      setConversation([...conversation, response])
      setChatboxDisabled(false)
      setResponse('')
      console.log({conversation});
    }
  }, [response])

  useEffect(() => {
    if(query) {
      getResponse().then(json => {
        console.log(json)
        if(json.response)
          setResponse(json.response);
        else if(json.error && JSON.stringify(json.error) !== '{}')
          alert(JSON.stringify(json.error))
        else
          alert("something went wrong but IDK what 🤷‍♂️ try refreshing");
        setQuery('')
      }).catch(err => {
        alert(err);
      })
    }
  }, [query])

  const appendToConversation = async (query: string) => {
    console.log(query);
    setConversation([...conversation, query]);
    setQuery(query);
  }

  const getResponse = async () => {
    const response = await fetch('/api/get-response', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ conversation, currentModel, currentMood })
    })
    return (await response.json())
  }

  const fixNewlines = (s: string) => {
    return s.split('\n').map(ss => <p className={styles.chatparagraph}>{ss}</p>)
  }

  return (
    <>
      <Head>
        <title>Chat: {currentModel}, {currentMood}</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className={styles.sidebar}>
          <ModelSelector currentModel={currentModel} setCurrentModel={setCurrentModel}/>
          <MoodSelector currentMood={currentMood} setCurrentMood={setCurrentMood}/>
          <DataSelector currentData={currentData} setCurrentData={setCurrentData}/>
          <br></br>
          <HumanEmojiSelector currentHumanEmoji={currentHumanEmoji} setCurrentHumanEmoji={setCurrentHumanEmoji}/>
          <RobotEmojiSelector currentRobotEmoji={currentRobotEmoji} setCurrentRobotEmoji={setCurrentRobotEmoji}/>
        </div>
      <main className={styles.main}>
        <div className={styles.description}>
          {conversation.map((item,i) => 
            <div className={[i % 2 == 0 ? styles.human: styles.robot, styles.chatcontainer].join(" ")} key={i}>
              {i%2==0? <>
                <p className={styles.chatlabel}>{currentHumanEmoji}</p>
              </> : <> 
                <p className={styles.chatlabel}>{currentRobotEmoji}</p>
              </>}
              <div className={styles.chattext}>{fixNewlines(item)}</div>
            </div>
          )}
        </div>
      </main>
      <div className={styles.chatbox}>
        <ChatBox addToList={appendToConversation} disabled={chatboxDisabled} setDisabled={setChatboxDisabled} />
      </div>
    </>
  )
}

const ModelSelector = ({currentModel, setCurrentModel}: {currentModel:string, setCurrentModel:any}) => {
  // allows user to select between four named models

  const handleModelClicked = (model: string) => {
    console.log(model);
    setCurrentModel(model);
  }
  return (
    <div className={styles.selectorcontainer}>
      <h3>Select model</h3>
      <p className={`${styles.selector} ${styles.disabled}`}>BioGPT</p>
      <p onClick={() => handleModelClicked("ada")} className={`${styles.selector} ${currentModel==="ada" ? styles.selected : ''}`}>GPT-3 Ada</p>
      <p onClick={() => handleModelClicked("curie")} className={`${styles.selector} ${currentModel==="curie" ? styles.selected : ''}`}>GPT-3 Curie</p>
      <p onClick={() => handleModelClicked("davinci")} className={`${styles.selector} ${currentModel==="davinci" ? styles.selected : ''}`}>GPT-3 Davinci</p>
    </div>
  )
}

const MoodSelector = ({ currentMood, setCurrentMood}: {currentMood:string, setCurrentMood:any}) => {
  // allows user to select between four named models

  const handleMoodClicked = (model: string) => {
    console.log(model);
    setCurrentMood(model);
  }
  return (
    <div className={styles.selectorcontainer}>
      <h3>Select prompt</h3>
      <p onClick={() => handleMoodClicked("bing-normal")} className={`${styles.selector} ${currentMood==="bing-normal" ? styles.selected : ''}`}>Bing</p>
      <p onClick={() => handleMoodClicked("bing-stoned")} className={`${styles.selector} ${currentMood==="bing-stoned" ? styles.selected : ''}`}>Bing (stoned)</p>
      <p onClick={() => handleMoodClicked("bing-cyberpunk")} className={`${styles.selector} ${currentMood==="bing-cyberpunk" ? styles.selected : ''}`}>Bing (cyberpunk)</p>
      <p onClick={() => handleMoodClicked("chat")} className={`${styles.selector} ${currentMood==="chat" ? styles.selected : ''}`}>chat</p>
      <p onClick={() => handleMoodClicked("none")} className={`${styles.selector} ${currentMood==="none" ? styles.selected : ''}`}>none</p>
      <p onClick={() => handleMoodClicked("very-safe")} className={`${styles.selector} ${currentMood==="very-safe" ? styles.selected : ''}`}>very safe</p>
    </div>
  )
}

const DataSelector = ({ currentData, setCurrentData}: {currentData:string, setCurrentData:any}) => {
  // allows user to select between four named models

  const handleDataClicked = (model: string) => {
    console.log(model);
    setCurrentData(model);
  }
  return (
    <div className={styles.selectorcontainer}>
      <h3>Select data</h3>
      <p onClick={() => handleDataClicked("none")} className={`${styles.selector} ${currentData==="none" ? styles.selected : ''}`}>none</p>
      <p className={styles.disabled}>Kagi search</p>
    </div>
  )
}

const HumanEmojiSelector = ({ currentHumanEmoji, setCurrentHumanEmoji}: {currentHumanEmoji:string, setCurrentHumanEmoji:any}) => {
  // allows user to select between four named models

  const handleDataClicked = (model: string) => {
    console.log(model);
    setCurrentHumanEmoji(model);
  }
  return (
    <div className={styles.selectorcontainer}>
      <h3 onClick={() => handleDataClicked("👨‍💻")} className={`${styles.selector} ${currentHumanEmoji==="👨‍💻" ? styles.selected : ''}`}>👨‍💻</h3>
      <h3 onClick={() => handleDataClicked("🌎")} className={`${styles.selector} ${currentHumanEmoji==="🌎" ? styles.selected : ''}`}>🌎</h3>
    </div>
  )
}

const RobotEmojiSelector = ({ currentRobotEmoji, setCurrentRobotEmoji}: {currentRobotEmoji:string, setCurrentRobotEmoji:any}) => {
  // allows user to select between four named models

  const handleDataClicked = (model: string) => {
    console.log(model);
    setCurrentRobotEmoji(model);
  }
  return (
    <div className={styles.selectorcontainer}>
      <h3 onClick={() => handleDataClicked("🤖")} className={`${styles.selector} ${currentRobotEmoji==="🤖" ? styles.selected : ''}`}>🤖</h3>
      <h3 onClick={() => handleDataClicked("👁")} className={`${styles.selector} ${currentRobotEmoji==="👁" ? styles.selected : ''}`}>👁</h3>
    </div>
  )
}

const ChatBox = ({ addToList, disabled, setDisabled }: {addToList: any, disabled: boolean, setDisabled: any}) => {
  const [message, setMessage] = useState('');

  const handleKeyDown = (e: any) => {
    const keyCode = e.keyCode;
    if(keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
  const handleChange = (e: any) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    addToList(message);
    setMessage('');
    setDisabled(true);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.description}>
      <fieldset>
        <textarea value={message} onChange={handleChange} onKeyDown={handleKeyDown}/>
        {/* <button type="submit" disabled={disabled}>Send</button> */}
      </fieldset>
    </form>
  );
};