import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Socket, connect } from 'net';

export class UnixSocketClient extends ClientProxy {
    private client: Socket;
    private connected: boolean = false;

    constructor(private readonly serviceId: string, private readonly socketPath: string) {
        super();
        if (process.platform === 'win32') {
            this.socketPath = '\\\\.\\pipe\\' + this.socketPath.replace(/\//g, '-');
        }
    }

    public connect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client = connect(this.socketPath);
            this.client.on('connect', () => {
                this.connected = true;
                // Register the service name when connected
                this.client.write(JSON.stringify({ register: this.serviceId }));
                console.log(`Service ${this.serviceId} connected`);
                resolve(true);
            });
            this.client.on('error', (err) => {
                console.log(`Service ${this.serviceId} disconnected due to error: ${err}`);
                reject(err);
            });
            this.client.on('close', () => {
                if (this.connected) {
                    console.log(`Service ${this.serviceId} disconnected`);
                    this.connected = false;
                    this.reconnect();
                }
            });
            this.client.on('data', (data) => this.processResponse(JSON.parse(data.toString())));
        });
    }

    private async reconnect() {
        let connected = false;
        while (!connected) {
            try {
                await this.connect();
                connected = true;
            } catch (e) {
                // Reconnect failed, wait for a second before the next attempt
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
        console.log(`Service ${this.serviceId} reconnected`);
    }

    private processResponse(response: any) {
        const { isDisposed, response: data, err, pattern } = response;
        const callback = this.routingMap.get(pattern);

        if (!callback) {
            return undefined;
        }

        if (isDisposed || err) {
            return callback({
                err,
                response: null,
                isDisposed: true,
            });
        }

        callback({
            err,
            response: data,
        });
    }

    public close() {
        this.client.end();
    }

    public publish(packet: ReadPacket, callback: (packet: WritePacket) => any): () => void {
        this.client.write(JSON.stringify(packet));
        return () => { };
    }

    protected dispatchEvent(packet: ReadPacket): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.write(JSON.stringify(packet), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve(null);
            });
        });
    }
}
