import { Controller, OnModuleInit } from '@nestjs/common';
import { MessagePattern, ServerTCP } from '@nestjs/microservices';
import { UnixSocketServer } from './unix-socket-server';

@Controller()
export class AppController implements OnModuleInit {
  private unixServer: UnixSocketServer;

  constructor() {
    this.unixServer = new UnixSocketServer('C:/Users/chen/workspace/socket', 5600);
  }

  async onModuleInit() {
    this.unixServer.addHandler('randomNumber', this.receiveRandomNumber);
    this.unixServer.listen(() => console.log('Server is listening'));
  }



  receiveRandomNumber(data: number): Promise<boolean> {
    console.log(`Received random number: ${data}`);
    return Promise.resolve(true);
  }


}


