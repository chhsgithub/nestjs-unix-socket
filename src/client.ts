import { ConnectionType, IpcClient } from './ipc-client';
import { IpcMsg } from './type';

console.log('client runing')

export class Plugin {
    private client: IpcClient;
    private intervalId: NodeJS.Timeout;

    constructor(serviceId: string, socketPath: string) {
        this.client = new IpcClient(serviceId, 5600, ConnectionType.TCP);
        this.client.connect();
    }

    ipcSend(msg: IpcMsg) {
        this.client.publish(msg, () => { });
    }

    stopSendingRandomNumbers() {
        clearInterval(this.intervalId);
    }
}

let plugin = new Plugin('test', 'C:/Users/chen/workspace/socket')
setInterval(() => {
    const randomNumber = Math.random();
    plugin.ipcSend({ pattern: 'random', dst: 'broadcast', data: randomNumber })
    console.log('interval', randomNumber)

}, 1000);

