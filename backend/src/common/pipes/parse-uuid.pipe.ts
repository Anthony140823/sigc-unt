// src/common/pipes/parse-uuid.pipe.ts
import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDv4Pipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException(
        `El valor "${value}" no es un UUID v4 válido.`,
      );
    }
    return value;
  }
}

// src/common/pipes/trim-string.pipe.ts


@Injectable()
export class TrimStringsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;
    return this.trimObject(value);
  }

  private trimObject(obj: any): any {
    if (typeof obj === 'string') return obj.trim();
    if (Array.isArray(obj)) return obj.map((v) => this.trimObject(v));
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce(
        (acc, key) => ({ ...acc, [key]: this.trimObject(obj[key]) }),
        {},
      );
    }
    return obj;
  }
}
