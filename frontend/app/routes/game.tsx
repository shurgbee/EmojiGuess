import type { Route } from "./+types/game";
import { Welcome } from "../welcome/welcome";
import { useEffect, useState, useRef } from "react";
import type App from "~/root";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { data } from "react-router";
import type { messageType } from "~/types";
import GameHeader from "~/components/gameHeader";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Game" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Game({ params }: Route.LoaderArgs) {
  let timerVar = useRef<NodeJS.Timeout | null>(null);
  const { sendJsonMessage, lastMessage, readyState, connectionStatus } = useWebSocketContext()
  const [guesser, setGuesser] = useState<boolean>(true)
  const [timer, setTimer] = useState<number>(30)
  let timerRef = useRef<number>(30)
  const [word, setWord] = useState('')
  const [messages, setMessages] = useState<messageType[]>([])
  
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
          if(timer != 30){
            console.log("something has gone wrong")
          } else {
            console.log("timer starting")
            timerVar.current = setInterval(handleTimer, 1000) 
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
          let newMessages: messageType[] = messages
          let newmsgdata: messageType = {"message": data['message'], "self": data["self"]}
          newMessages.push(newmsgdata)
          setMessages(newMessages)
        default:
          console.log('data not processed:', data['cmd'])
          break;
      }
    }
  },[lastMessage])

  function handleTimer(){
    console.log('running handle')
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
    console.log('round has ended')
  }

  async function sendText(text: string){
    if(!guesser){
      //check to see if message only has emojis
    }
    console.log(text)
    sendJsonMessage(
      {"cmd":"message",
        "message":text
      })
  }

  return (
    <>
    <div className="flex flex-col content-center justify-end w-full items-stretch gap">
      <div className="flex flex-col content-center items-center justify-center w-full">
          <h1 className="text-2xl font-bold mb-4">Game Room: {params.roomCode}</h1>
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'Open' ? 'bg-green-500 text-white' : 
              connectionStatus === 'Connecting' ? 'bg-yellow-500 text-black' : 
              'bg-red-500 text-white'
            }`}>
              WebSocket: {connectionStatus}
            </span>
          </div>
      </div>
      <GameHeader roomCode={params.roomCode} timer={timer} guesser={guesser} word={word} />
      <div className="grow h-[84vh] w-full">
        Hi
        {messages.map((message) =>
        <div>
          <p>{message.self}</p>
          <p>{message.message}</p>
        </div>
        )}
      </div>
      <div className="w-full self-end pb-[1vh]">
        <form onSubmit={(e) => {
          e.preventDefault();
          sendText(e.target[0].value);
        }}>
          <input className="w-full bg-stone-600 rounded-xl h-[5vh] px-2" placeholder="Type here"/>
        </form>
      </div>
    </div>
    </>
  )
}
