import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SmartWalletController } from './controllers/smart-wallet.controller';
import { CdpService } from './services/cdp.service';

@Module({
  imports: [],
  controllers: [AppController, SmartWalletController],
  providers: [AppService, CdpService],
})
export class AppModule {}
