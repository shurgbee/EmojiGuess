from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
import json
import random
import string
import time
import asyncio

app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Player:
    def __init__(self, player: WebSocket, name: str, guesser: bool):
        self.player = player
        self.name = name
        self.guesser = guesser
        pass

class Room:
    def __init__(self, guesser: Player, teller: Player):
        self.ready = 0
        self.guesser = guesser
        self.teller : Player = teller
        self.word = "Beans"
        self.joinCode = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        self.timer = None
        pass

    def broadcast(message: str, player: Player):
        if(not player.guesser):
            print('filter for emojis')

    async def start(self):
        self.ready += 1
        if self.ready == 2:
            print('ready to start')
            tellerJson = {
                "cmd": "start",
                "word": self.word
            }
            self.teller.player.send_json(tellerJson)
            guesserJson = {
                "cmd": "start"
            }
            self.guesser.player.send_json(guesserJson)
            self.timer = asyncio.create_task(self.countdown())
            await self.end()
        else: 
            print('waiting for other player') 

    async def countdown(self):
        await asyncio.sleep(30)
        await self.end()

    async def end(self):
        await self.timer.cancel()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.roomList: list[Room] = []
        self.guesserQueue: list[Player] = []
        self.tellerQueue: list[Player] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        data : JSONResponse= await websocket.receive_json() 
        name = data['name']
        isGuesser : bool = data['guesser']
        player = Player(websocket, name, isGuesser)
        self.active_connections.append(websocket)
        return player

    def queue(self, player: Player):
        self.guesserQueue.append(player) if player.guesser else self.tellerQueue.append(player)
        self.instantiateRoom()

    def disconnect(self, player: Player):
        self.active_connections.remove(player.player)
        self.guesserQueue.remove(player) if player.guesser else self.tellerQueue.remove(player)

    def send_priv_message(self, message: str, websocket: WebSocket):
        websocket.send_text(message)
    
    def joinRoom(self, code: str, player: Player):
        for room in self.roomList:
            if code == room.joinCode:
                if room.guesser:
                    room.teller = player
    
    async def instantiateRoom(self):
        if len(self.guesserQueue) > 0 and len(self.tellerQueue) > 0:
            guesser = self.guesserQueue.pop(0)
            teller = self.tellerQueue.pop(0)
            room = Room(guesser, teller)
            self.routing(self.guesserQueue[0], room)
            self.routing(self.tellerQueue[0], room)
            return room
        else:
            return None

    async def broadcast(self, websocket: WebSocket, message: str):
        for conn in self.active_connections:
            await conn.send_text(message)

    def routing(player: Player, room: Room):
        sendJson = {"room": room.joinCode}
        player.player.send_json(sendJson)


manager = ConnectionManager()
    
@app.get("/")
async def get():
    return "Server is running!" 


@app.websocket("/ws/match")
async def ws_match(ws: WebSocket):
    player = await manager.connect(ws)
    room = None
    try:
        while True:
            msg: dict = await ws.receive_json()
            cmd = msg.get("cmd")
            
            match cmd:
                case "join":
                    room = manager.queue(player)
                case "text":
                    if(room != None):
                        room.broadcast(msg['message'])
                    else:
                        print('oopsies')

    except WebSocketDisconnect:
        # if a socket drops before pairing or mid-game, clean up:
        if ws in manager.tellersQueue:  manager.tellersQueue.remove(ws)
        if ws in manager.guessersQueue: manager.guessersQueue.remove(ws)
        # find and tear down any room containing ws
        for room in manager.roomList:
            if ws in (room.teller, room.guesser):
                await room.end(winner=("guesser" if ws is room.teller else "teller"),
                               reason="disconnect")



async def matchmaking():
    while True:
        manager.instantiateRoom()
        await time.sleep(1)


matchmaking()