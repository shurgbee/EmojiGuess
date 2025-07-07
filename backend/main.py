from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
import json

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

class GameObject:
    def __init__(self, websocket: WebSocket, isGuesser: bool, name: str):
        self.websocket = websocket
        self.isGuesser = isGuesser
        self.name = name
        pass

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.players: list[GameObject] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        data : JSONResponse= await websocket.receive_json() 
        name = data['name']
        isGuesser : bool = data['guesser']
        self.players.append(GameObject(websocket, isGuesser, name))
        self.active_connections.append(websocket)
        return True

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    def send_priv_message(self, message: str, websocket: WebSocket):
        websocket.send_text(message)

    async def broadcast(self, websocket: WebSocket, message: str):
        for conn in self.active_connections:
            await conn.send_text(message)


manager = ConnectionManager()
    
@app.get("/")
async def get():
    return "Server is running!" 


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket)
    try: 
        while True:
            data = await websocket.receive_json()
            print(f"You just sent {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)