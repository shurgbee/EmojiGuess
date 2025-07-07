import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect, useState } from "react";
import type { userType } from "../routes.ts";
import type App from "~/root";
import { Link } from "react-router";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  useEffect(()=>{
    const userString : string | null = localStorage.getItem("EmojiGuessUser")
    if(userString){
      const userJSON = JSON.parse(userString)
      setStats(userJSON)
    } 
  }, [])
  const [stats, setStats] = useState<userType>()
  return (
    <>
    <div className="flex items-center justify-center w-screen">
      <div className="flex flex-col self-center">
          <h1 className='font-black mb-6'>
            {stats ? 
            "Welcome Back" + stats.name
            :
            "Welcome to Emoji Guess! 👋"
            }
            </h1>
          <div className='bg-emerald-950 rounded-4xl'>
            {stats ? 
            <h2 className='text-3xl font-bold pt-6'>Total Wins: {stats.wins}</h2>
            :
            <p className="text-center">Sign Up</p>
            }
            <div className='flex flex-col gap-4 p-7 *:m-3 items-center'>
              <Link to="/game" className="w-md">
                <button className="w-full">
                  Join Game
                </button>
              </Link>
                <button>
                  <p>Join Room with Code</p>
                </button>
                <button>
                  <p>Create Room</p>
                </button>
              </div>
          </div>
        </div>
    </div>
    </>
  )
}
