import { Controller, OnModuleInit } from '@nestjs/common';
import { MessagePattern, ServerTCP } from '@nestjs/microservices';
import { UnixSocketServer } from './unix-socket-server';

@Controller()
export class AppController implements OnModuleInit {
  private server: UnixSocketServer;

  constructor() {
    this.server = new UnixSocketServer('C:/Users/chen/workspace/socket');
  }

  async onModuleInit() {
    this.server.addHandler('randomNumber', this.receiveRandomNumber);
    this.server.listen(() => console.log('Server is listening'));
  }



  receiveRandomNumber(data: number): Promise<boolean> {
    console.log(`Received random number: ${data}`);
    return Promise.resolve(true);
  }


}


