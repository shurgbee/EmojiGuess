import type { Route } from "./+types/game";
import { Welcome } from "../welcome/welcome";
import { useEffect, useState, useRef } from "react";
import type App from "~/root";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { data, Navigate, useNavigate } from "react-router";
import type { messageType } from "~/types";
import GameHeader from "~/components/gameHeader";
import EndModal from "~/components/endModal";
import WSConDot from "~/components/ConnDot";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Game" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Game({ params }: Route.LoaderArgs) {
  let navigate = useNavigate()
  let timerVar = useRef<NodeJS.Timeout | null>(null);
  const win = useRef<boolean>(false); 
  const { sendJsonMessage, lastMessage, readyState, connectionStatus } = useWebSocketContext()
  const [guesser, setGuesser] = useState<boolean>(true)
  const [timer, setTimer] = useState<number>(60)
  let timerRef = useRef<number>(60)
  const [word, setWord] = useState('')
  const [messages, setMessages] = useState<messageType[]>([])
  const [gameEnd, setGameEnd] = useState<boolean>()
  
  useEffect(()=>{
    console.log('Game component mounted, WebSocket status:', connectionStatus)
  }, [connectionStatus])

  useEffect(()=>{
    sendJsonMessage({"cmd":"ready","room":params.roomCode})
    return () => {
      console.log("exiting")
      if(timerVar.current != null)
        window.clearInterval(timerVar.current)
    }
  },[])
  
  useEffect(()=>{
    if(lastMessage?.data){
      console.log('last message:', JSON.parse(lastMessage?.data))
      let data : any = JSON.parse(lastMessage.data)
      switch(data['cmd']){
        case "timer":
          if(timer != 60){
            console.log("something has gone wrong")
          } else {
            console.log("timer starting")
            timerVar.current = setInterval(() => handleTimer(), 1000) 
            console.log(timer)
          }
          break;
        case "start":
          if(data['word'] == null){
            console.log('guesser')
            setGuesser(true)
          } else {
            console.log('isTeller')
            console.log('word is '+data['word'])
            setWord(data['word'])
            setGuesser(false)
          }
        case "message":
          console.log('messages', messages)
          let newMessages: messageType[] = messages
          let newmsgdata: messageType = {"message": data['message'], "self": data["self"]}
          if(newmsgdata.message != ""){
            newMessages.push(newmsgdata)
            setMessages(newMessages)
          }
          break;
        case "end":
          if(!gameEnd){
            console.log("Game has ended", data);
            win.current = data['win'];
            setWord(data['word'])
            setGameEnd(true)
            if(timerVar.current != null){
              clearInterval(timerVar.current)
            }
          }
          break;
        case "disconnect":
          alert("The other player has disconnected: You will be returned to lobby in 3 seconds")
          setTimeout(() => navigate('/'), 3000)
          break;
        default:
          console.log('data not processed:', data['cmd'])
          break;
      }
    }
  },[lastMessage])

  function handleTimer(){
    if(timerRef.current == 0){
      handleEnd()
    } else {
      setTimer(prev => prev - 1)
      timerRef.current -= 1
      console.log(timer, timerRef.current)
    }
  }

  function handleEnd(){
    if(timerVar.current != null){
      window.clearInterval(timerVar.current)
    }
    setGameEnd(true)
  }

  async function sendText(text: string){
    if(!guesser){
    }
    console.log(text)
    sendJsonMessage(
      {"cmd":"message",
        "message":text
      })
  }

  function trimEmojis(text: string){
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu;
    const emojis = text.match(emojiRegex) || [];
    const emojisText = emojis.join('');
    return emojisText
  }

  return (
    <>
    {gameEnd ? <EndModal win={win.current} word={word} countdown={timer}/>: <></>}
    <div className="flex flex-col content-center justify-end w-full gap">
      <WSConDot connectionStatus={connectionStatus}/>
      <GameHeader roomCode={params.roomCode} timer={timer} guesser={guesser} word={word} />
      <div className="w-full gap-1 flex flex-col h-[84vh] overflow-y-scroll overscroll-contain">
        {messages.map((message, index) =>
        <div key={index} className={(message.self ? "flex-row-reverse" : "flex-row")+" flex"}>
          <div className={(message.self ? "bg-emerald-700" : "bg-blue-700")+" p-2 rounded-3xl text-4xl"}>
            <p>{message.message}</p>
          </div>
        </div>
        )}
      </div>
      <div className="w-full self-end pb-[1vh]">
        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          let input = form.elements[0] as HTMLInputElement;
          const emojiTrim = trimEmojis(input.value)
          if(input.value.trim() != ""){
            if((!guesser && emojiTrim != "")){
              sendText(emojiTrim);
              input.value = ""
            } else if (guesser){
              sendText(input.value);
              input.value = ""
            }
          }
        }}>
          <input className="w-full bg-stone-600 rounded-xl h-[5vh] px-2" placeholder="Type here"/>
        </form>
      </div>
    </div>
    </>
  )
}
