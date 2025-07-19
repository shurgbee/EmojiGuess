
import { Welcome } from "../welcome/welcome";
import { useEffect, useState, useRef } from "react";
import type App from "~/root";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { data } from "react-router";
import type { messageType } from "~/types";

type GameHeaderProps = {
  connectionStatus: string;
};
const getColor = (state: string): string => {
switch (state) {
    case "Connecting": return 'bg-yellow-600 text-white';
    case "Open": return 'bg-green-600 text-white';
    case "Closing": return 'bg-orange-600 text-black';
    case "Closed": return 'bg-red-600 text-black';
    default: {return ''; console.log(state);}
    }
}


export default function WSConDot({connectionStatus}: GameHeaderProps) {
    const [Color, setColor] = useState<string>('')
    useEffect(()=>{
        setColor(getColor(connectionStatus))
    },[connectionStatus])

  return (
    <div className={`${Color} text-lg  w-fit absolute top-0 left-0 z-10 rounded-xl p-1`}>{connectionStatus}</div>
  );
}