import { Server, MessageHandler } from '@nestjs/microservices';
import { createServer, Server as NetServer, Socket } from 'net';
import { Observable } from 'rxjs';

export class UnixSocketServer extends Server {
    private unixServer: NetServer;
    private tcpServer: NetServer;
    private clients: Map<string, Socket> = new Map();
    private handlers: Map<string, MessageHandler[]> = new Map();

    constructor(private readonly socketPath: string, private readonly tcpPort: number) {
        super();
        this.unixServer = createServer(this.handleConnection.bind(this));
        this.tcpServer = createServer(this.handleConnection.bind(this));
        if (process.platform === 'win32') {
            this.socketPath = '\\\\.\\pipe\\' + this.socketPath.replace(/\//g, '-');
        }
    }

    public listen(callback: () => void) {
        this.unixServer.listen(this.socketPath, callback);
        this.tcpServer.listen(this.tcpPort, () => {
            console.log(`TCP server is listening on port ${this.tcpPort}`);
        });
    }

    public close() {
        this.unixServer.close();
        this.tcpServer.close();
    }

    public addHandler(pattern: any, callback: MessageHandler) {
        const handlers = this.handlers.get(pattern) || [];
        handlers.push(callback);
        this.handlers.set(pattern, handlers);
    }

    private handleConnection(client: Socket) {
        client.on('data', (data) => {
            const message = JSON.parse(data.toString());

            if (message.register) {
                this.clients.set(message.register, client);
                console.log(`Service ${message.register} connected`);
                return;
            }

            const { pattern, data: payload } = message;

            const serviceName = this.getServiceName(client);
            if (serviceName) {
                console.log(`Received data from ${serviceName}: ${data.toString()}`);
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

        client.on('end', () => {
            const serviceName = this.getServiceName(client);
            if (serviceName) {
                console.log(`Service ${serviceName} disconnected`);
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
