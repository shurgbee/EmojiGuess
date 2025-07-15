export interface userType{
    name: string
    wins: number
    id: string | null
}

export interface roomNavType{
    id: string,
    room: string
}

export interface messageType{
    message: string,
    self: boolean
}