import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TextractService } from './textract.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [TextractService],
})
export class AppModule { }
