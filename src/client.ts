import { ConnectionType, UnixSocketClient } from './unix-socket-client';
console.log('client runing')

export class RandomNumberClient {
    private client: UnixSocketClient;
    private intervalId: NodeJS.Timeout;

    constructor(serviceId: string, socketPath: string) {
        this.client = new UnixSocketClient(serviceId, 5600, ConnectionType.TCP);
        this.client.connect();
    }

    startSendingRandomNumbers() {
        this.intervalId = setInterval(() => {

            const randomNumber = Math.random();
            console.log('interval', randomNumber)
            this.client.publish({ pattern: 'randomNumber', data: randomNumber }, () => { });
        }, 1000);
    }

    stopSendingRandomNumbers() {
        clearInterval(this.intervalId);
    }
}

let t = new RandomNumberClient('test', 'C:/Users/chen/workspace/socket')
t.startSendingRandomNumbers()
