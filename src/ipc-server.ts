import { Server, MessageHandler } from '@nestjs/microservices';
import { createServer, Server as NetServer, Socket } from 'net';
import { Observable } from 'rxjs';

export class IpcServer extends Server {
    private static instance: IpcServer;
    private unixServer: NetServer;
    private tcpServer: NetServer;
    private clients: Map<string, Socket> = new Map();
    private handlers: Map<string, MessageHandler[]> = new Map();
    #listened = false

    public static getInstance(): IpcServer {
        if (!IpcServer.instance) {
            IpcServer.instance = new IpcServer();
        }
        return IpcServer.instance;
    }

    private constructor() {
        super();

    }

    public listen(socketPath: string, tcpPort: number, callback: () => void) {
        if (this.#listened) {
            console.warn('ipc was already listened')
            return;
        }
        this.#listened = true;
        this.unixServer = createServer(this.handleConnection.bind(this));
        this.tcpServer = createServer(this.handleConnection.bind(this));
        if (process.platform === 'win32') {
            socketPath = '\\\\.\\pipe\\' + socketPath.replace(/\//g, '-');
        }

        this.unixServer.listen(socketPath, callback);
        this.tcpServer.listen(tcpPort, '0.0.0.0', () => {
            console.log(`TCP server is listening on port ${tcpPort}`);
        });
    }

    public close() {
        this.unixServer.close();
        this.tcpServer.close();
    }

    public addHandler(pattern: string, callback: MessageHandler) {
        const handlers = this.handlers.get(pattern) || [];
        handlers.push(callback);
        this.handlers.set(pattern, handlers);
    }

    public sendToClient(serviceName: string, message: any): void {
        const client = this.clients.get(serviceName);
        if (!client) {
            console.log(`Service ${serviceName} not found`);
            return;
        }
        client.write(JSON.stringify(message));
    }

    private handleConnection(client: Socket) {
        client.on('data', (buffer) => {
            const message = JSON.parse(buffer.toString());

            if (message.register) {
                this.clients.set(message.register, client);
                console.log(`Service ${message.register} connected`);
                return;
            }

            const { pattern, data: payload } = message;

            const serviceName = this.getServiceName(client);
            if (serviceName) {
                console.log(`Received data from ${serviceName}: ${buffer.toString()}`);
            }

            const handlers = this.handlers.get(pattern);
            if (!handlers) {
                return undefined;
            }

            const response$ = handlers.map((handler) =>
                this.transformToObservable(handler(payload)),
            ) as Observable<any>[];

            response$[0].subscribe((response) =>
                client.write(JSON.stringify(response)),
            );
        });

        client.on('error', () => {
            const serviceName = this.getServiceName(client);
            if (serviceName) {
                console.log(`Service ${serviceName} disconnected:error`);

            }
        });

        client.on('end', () => {
            const serviceName = this.getServiceName(client);
            if (serviceName) {
                console.log(`Service ${serviceName} disconnected:end`);
                this.clients.delete(serviceName);
            }
        });
    }

    private getServiceName(client: Socket): string | undefined {
        for (const [name, c] of this.clients.entries()) {
            if (c === client) {
                return name;
            }
        }
        return undefined;
    }
}
