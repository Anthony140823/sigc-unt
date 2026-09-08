import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsultarDto {
  @ApiProperty({ example: '¿Cómo funciona CAPA?', description: 'Mensaje del usuario' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  mensaje: string;
}

@ApiTags('chatbot')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'chatbot', version: '1' })
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('consultar')
  @HttpCode(200)
  @ApiOperation({ summary: 'Consultar al asistente virtual del SIGC' })
  async consultar(@Body() dto: ConsultarDto) {
    const respuesta = await this.chatbotService.consultar(dto.mensaje);
    return { exito: true, datos: respuesta };
  }
}
