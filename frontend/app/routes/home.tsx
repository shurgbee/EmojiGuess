import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import React, { useEffect, useState, useCallback } from "react";
import type App from "~/root";
import { Link } from "react-router";
import { redirect, useNavigate } from "react-router";
import type { roomNavType, userType } from "~/types";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import EndModal from '../components/endModal'
import WSConDot from "~/components/ConnDot";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Emoji Guess" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {

  let navigate = useNavigate()
  const [stats, setStats] = useState<userType>()
  const [joindropDown, setjoinDropDown] = useState(false)
  const [codeDD, setcodeDD] = useState(false)
  const [firstLoad, setfirstLoad] = useState(false)
  
  const {sendJsonMessage, lastMessage, readyState, connectionStatus} = useWebSocketContext();

  async function triggerRedirect(room: string, id: string){
    const userString : string | null = localStorage.getItem("EmojiGuessUser")
    if(userString){
      const userJSON : userType = JSON.parse(userString)
      userJSON['id'] = id;
      localStorage.setItem("EmojiGuessUser", JSON.stringify(userJSON))
      console.log('trigger')
      await navigate(`/game/${room}`)
    }
  }

  useEffect(() => {
    if(firstLoad){
      console.log("current state is "+readyState)
    }
  }, [readyState])

  useEffect(() => {
    const userString : string | null = localStorage.getItem("EmojiGuessUser")
    if(userString){
      const userJSON = JSON.parse(userString)
      setStats(userJSON)
    } 
    setfirstLoad(true)
  }, [])

  useEffect(()=>{
    if(firstLoad){
      if(lastMessage){
        const messageJson : roomNavType = JSON.parse(lastMessage.data)
        console.log('received data', messageJson)
        triggerRedirect(messageJson['room'], messageJson['id'])
      }
    }
    return () => {
      setfirstLoad(false)
    }

  },[lastMessage])



  async function handleNavigate(guesser: boolean){
    if(firstLoad){
      const joinJson = {
        "cmd": "join",
        "guesser": guesser
      }
      sendJsonMessage(joinJson)
    } else {
      console.log("not loaded")
    }
  }

  function handleCodeNavigate(code: string){
    console.log(code)
  }

  function handleNameSet(name: string){
    console.log(name)
    const userString : string | null = localStorage.getItem("EmojiGuessUser")
    if(userString){
      const userJSON : userType = JSON.parse(userString)
      userJSON['name'] = name;
      localStorage.setItem("EmojiGuessUser", JSON.stringify(userJSON))
      setStats(userJSON)
    } else {
      const newString : userType= {name: name, wins: 0, id: null}
      localStorage.setItem("EmojiGuessUser", JSON.stringify(newString))
      setStats(newString)
    }
  }

  return (
    <>
    <div className="flex items-center justify-center w-screen">
      <div className="flex flex-col self-center w-[40vw]">
        <WSConDot connectionStatus={connectionStatus}/>
          <p className="text-red-500 text-xl text-wrap absolute top-1/8 w-[40vw]">This site (and the server) is hosted on Render.com, which shuts down servers due to inactivity. Please allow 30 seconds - 1 min for the server to wake up</p>
          <h1 className='font-black mb-6'>
            {stats ? 
            "Welcome Back " + stats.name
            :
            "Welcome to Emoji Guess! 👋"
            }
            </h1>
          <div className='bg-emerald-700 rounded-4xl items-center flex flex-col'>
            {stats ? 
            <h2 className='text-3xl font-bold pt-6'>Total Wins: {stats.wins}</h2>
            :
            <>
            <div className="flex flex-col items-center">
            <p className="text-center text-xl font-bold">Sign Up Below</p>
            <form onSubmit={(e) =>{
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const input = form.elements[0] as HTMLInputElement;
              handleNameSet(input.value)
            } 
            }>
              <input className="bg-stone-900 border-4 rounded-2xl w-lg p-2" placeholder="Type name here"></input>
            </form>
            </div>
            </>
            }
            <div className='flex flex-col gap-4 p-7 *:m-3 items-center'>
              <div className="flex flex-col items-center gap-2 bg-emerald-900  rounded-4xl w-full">
                { joindropDown ? 
                <>
                  <div className="flex flex-row gap-2 ">
                    <button onClick={()=>handleNavigate(true)}>Join as Guesser</button>
                    <button onClick={()=>handleNavigate(false)}>Join as Teller</button>
                  </div>
                </>
                :
                <>
                <button onClick={(e) => {
                  e.preventDefault()
                  setjoinDropDown(!joindropDown)
                  }}>
                  Join Game
                </button>
                </>
                }
                </div>
                { codeDD ? 
                <>
                  <form onSubmit={(e) =>{
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const input = form.elements[0] as HTMLInputElement;
                    handleCodeNavigate(input.value)
                  } 
                  }>
                    <input className="bg-stone-900 border-4 rounded-2xl p-2" placeholder="Type code here"></input>
                  </form>
                </>
                :
                <>
                <button onClick={(e) => {
                  e.preventDefault()
                  alert("Coming Soon!")
                  // setcodeDD(!codeDD)
                  }}>
                  Join Room with Code
                </button>
                </>
                }
                <button onClick={(e)=>{
                  e.preventDefault()
                  alert("Coming Soon!")
                }}>
                  <p>Create Room</p>
                </button>
              </div>
          </div>
        </div>
    </div>
    </>
  )
}
