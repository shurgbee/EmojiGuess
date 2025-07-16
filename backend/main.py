from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
import json
import random
import string
import uuid
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


class EndType(Enum):
    DISCONNECT = 1
    WIN = 2
    TIMEOUT = 3

class Player:
    def __init__(self, player: WebSocket, name: str):
        self.player = player
        self.name = name
        self.guesser = False
        self.uuid = str(uuid.uuid4())
        pass

class Room:
    def __init__(self, guesser: Player, teller: Player):
        self.ready = 0
        self.guesser = guesser
        self.teller : Player = teller
        self.word = "Chair"
        self.joinCode = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        self.timer = None
        pass

    async def broadcast(self, message: str, player: Player):
        gJson = {"cmd": "message",
                 "message":message,
                 "self": player.player == self.guesser.player}
        await self.guesser.player.send_json(gJson)
        tJson = {"cmd": "message",
                 "message":message,
                 "self": player.player == self.teller.player}
        await self.teller.player.send_json(tJson)
        print("sent message: ", message)
        if(message.find(self.word) != -1):
            print("word found!")
            await self.end(EndType.WIN)
        pass

    def __del__(self):
        print(self.joinCode +' room is being deleted')

    async def start(self):
        self.ready += 1
        if self.ready == 2:
            print('ready to start')
            tellerJson = {
                "cmd": "start",
                "word": self.word
            }
            await self.teller.player.send_json(tellerJson)
            guesserJson = {
                "cmd": "start"
            }
            await self.guesser.player.send_json(guesserJson)
            self.timer = asyncio.create_task(self.countdown())
            await self.guesser.player.send_json({"cmd":"timer"})
            await self.teller.player.send_json({"cmd":"timer"})
            try:
                self.timer
            except asyncio.CancelledError:
                pass
        else: 
            print("Ready:"+str(self.ready))

    async def countdown(self):
        await asyncio.sleep(60)
        await self.end(EndType.TIMEOUT)

    async def end(self, winCondition: EndType):
        try:
            tempVar = self.timer.cancel()
        except asyncio.exceptions.CancelledError:
            print('task cancelled ', tempVar)
        finally:
            match winCondition:
                case EndType.DISCONNECT:
                    print('a player has disconnected')
                    sJSon = {"cmd":"disconnect"}
                    await self.guesser.player.send_json(sJSon)
                    await self.teller.player.send_json(sJSon)
                case EndType.WIN:
                    print('a player has won')
                    await self.endScreen(True)
                case EndType.TIMEOUT:
                    print("Timeout: No player wins")
                    await self.endScreen(False)
            manager.roomList.pop(self.joinCode) 

    async def endScreen(self, win: bool):
        sJson = {"cmd":"end",
                    "win": win,
                    "word": self.word}
        await self.guesser.player.send_json(sJson)
        await self.teller.player.send_json(sJson)
        print('finished')


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.roomList: dict[str,Room] = {} 
        self.guesserQueue: list[Player] = []
        self.tellerQueue: list[Player] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        data : JSONResponse= await websocket.receive_json()
        print("players has connected",data) 
        name = data['name']
        player = Player(websocket, name)
        self.active_connections.append(websocket)
        return player

    async def queue(self, player: Player):
        self.guesserQueue.append(player) if player.guesser else self.tellerQueue.append(player)
        await self.instantiateRoom()
    
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
            self.roomList[room.joinCode] = room
            await self.routing(guesser, room)
            await self.routing(teller, room)
            print("Room instantiated")
        else:
            print("Room not instantiated")

    async def routing(self, player: Player, room: Room):
        sendJson = {"room": room.joinCode,
                    "id": player.uuid}
        await player.player.send_json(sendJson)


manager = ConnectionManager()
    
@app.get("/")
async def get():
    return "Server is running!" 

@app.get("/roomList")
async def roomList():
    print(manager.roomList)

@app.get("/activeConnections")
async def activeConnections():
    print(manager.active_connections)

@app.websocket("/ws/match")
async def ws_match(ws: WebSocket):
    player = await manager.connect(ws)
    room : Room = None
    try:
        while True:
            # print('waiting')
            msg: dict = await ws.receive_json()
            cmd = msg.get("cmd")
            print('cmd received', msg) 
            match cmd:
                case "join":
                    player.guesser = msg['guesser']
                    await manager.queue(player)
                case "message":
                    if(room != None):
                        await room.broadcast(msg['message'], player)
                    else:
                        print('oopsies')
                case 'ready':
                    if(room == None):
                        room = manager.roomList.get(msg.get("room"))
                        print(room.joinCode)
                        await room.start()
                case _:
                    print('oh no')
                    print(msg)
    except WebSocketDisconnect:
        if ws in manager.tellerQueue:  manager.tellerQueue.remove(ws)
        if ws in manager.guesserQueue: manager.guesserQueue.remove(ws)
        for room in manager.roomList.values():
            if ws in (room.teller, room.guesser):
                await room.end(EndType.DISCONNECT)
