import { Module } from '@nestjs/common';
import { BscController } from './bsc.controller';
import { BscService } from './bsc.service';

@Module({
  controllers: [BscController],
  providers: [BscService],
})
export class BscModule {}
