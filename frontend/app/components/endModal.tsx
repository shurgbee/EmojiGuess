
import { Welcome } from "../welcome/welcome";
import { useEffect, useState, useRef } from "react";
import type App from "~/root";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { data, useNavigate } from "react-router";
import type { messageType, userType } from "~/types";

type EndModalProps = {
    win: boolean
    word: string
    countdown: number
};

export default function endModal({win, word}: EndModalProps) {
  let navigate = useNavigate()
  let timerObj = useRef<NodeJS.Timeout | null>(null)
  let timerRef = useRef<number>(10);
  const [timer, setTimer] = useState<number>(10)
  let debounce: boolean = true

  function countdown(){
    console.log(timerRef)
    if(timerRef.current > 1){
      setTimer(prev => prev - 1)
      timerRef.current -= 1
    } else {
      navigate('/')
    }
  }

  useEffect(()=>{
    timerObj.current = setInterval(() => countdown(), 1000)
    if(win && debounce){
      debounce = false
      const userString = localStorage.getItem("EmojiGuessUser")
      if (userString){
        let userInfo: userType = JSON.parse(userString)
        console.log('bruh')
        userInfo['wins'] += 1 
        localStorage.setItem("EmojiGuessUser", JSON.stringify(userInfo))
      debounce = true
      } else{
        console.log("what")
      }
    }
    return () => {
      if (timerObj.current !== null) {
        clearInterval(timerObj.current);
      }
    }
  },[])
  return (
    <div className="bg-stone-950 text-4xl w-fit absolute items-center flex flex-col rounded-4xl opacity-95 gap-5 left-0 right-0 m-auto p-20">
      <h1 className="font-extrabold">You {win ? "Win!": "Lose"}</h1>
      <p className="animate-[fadeIn_1s_ease-in-out_1]"> The Word Was <span className="font-black">{word}</span></p>
      <div className="flex flex-row align-end">
        <button onClick={() => navigate('/')}>Return to lobby ({timer})</button>
      </div>
    </div>
  );
}