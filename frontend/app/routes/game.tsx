import type { Route } from "./+types/game";
import { Welcome } from "../welcome/welcome";
import { useEffect, useState } from "react";
import type App from "~/root";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { data } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Game" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Game({ params }: Route.LoaderArgs) {
  console.log(params)
  const { sendJsonMessage, lastMessage, readyState, connectionStatus } = useWebSocketContext()
  
  useEffect(()=>{
    console.log('Game component mounted, WebSocket status:', connectionStatus)
  }, [connectionStatus])


  return (
    <>
    <div className="flex flex-col content-center items-center justify-center w-screen">
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
        <div className="text-center">
          Testing Game Page
        </div>
    </div>
    </>
  )
}
