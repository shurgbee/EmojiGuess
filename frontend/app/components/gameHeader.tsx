import { Welcome } from "../welcome/welcome";
import { useEffect, useState, useRef } from "react";
import type App from "~/root";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { data } from "react-router";
import type { messageType } from "~/types";

type GameHeaderProps = {
  timer: number;
  guesser: boolean;
  word: string | null;
  roomCode: string;
};

export default function GameHeader({timer, guesser, word, roomCode}: GameHeaderProps) {
  return (
    <div className="bg-stone-500 h-[10vh] flex flex-row items-center content-center justify-center gap-20 text-4xl font-bold">
    <p className="">Role: {guesser ? "Guesser" : "Teller"}</p>
    <p className=""> Timer: {timer}</p>
    { !guesser ? <p>Word: {word}</p> : null}
        <p className="">Game Room: {roomCode}</p>
    </div>
  );
}