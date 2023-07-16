import { Controller, OnModuleInit } from '@nestjs/common';
import { MessagePattern, ServerTCP } from '@nestjs/microservices';
import { IpcServer } from './ipc-server';

@Controller()
export class AppController implements OnModuleInit {
  #ipcServer: IpcServer;

  constructor() {
    this.#ipcServer = IpcServer.getInstance();
  }

  async onModuleInit() {
    this.#ipcServer.addHandler('randomNumber', this.receiveRandomNumber);
    this.#ipcServer.listen('C:/Users/chen/workspace/socket', 5600, () => console.log('Server is listening'));
  }

  getHello() {
    return 'Hello World!'
  }

  receiveRandomNumber(data: number): Promise<boolean> {
    console.log(`Received random number: ${data}`);
    return Promise.resolve(true);
  }
}


