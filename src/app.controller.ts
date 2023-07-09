import { Controller, OnModuleInit } from '@nestjs/common';
import { MessagePattern, ServerTCP } from '@nestjs/microservices';
import { IpcServer } from './ipc-server';

@Controller()
export class AppController implements OnModuleInit {
  private unixServer: IpcServer;

  constructor() {
    this.unixServer = new IpcServer('C:/Users/chen/workspace/socket', 5600);
  }

  async onModuleInit() {
    this.unixServer.addHandler('randomNumber', this.receiveRandomNumber);
    this.unixServer.listen(() => console.log('Server is listening'));
  }

  getHello() {
    return 'Hello World!'
  }

  receiveRandomNumber(data: number): Promise<boolean> {
    console.log(`Received random number: ${data}`);
    return Promise.resolve(true);
  }
}


