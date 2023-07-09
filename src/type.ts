type MsgType = 'broadcast' | 'webRpc' | 'getUser'

export interface IpcMsg {
    pattern: MsgType | string,
    src?: string,
    dst: string,
    data: any
}