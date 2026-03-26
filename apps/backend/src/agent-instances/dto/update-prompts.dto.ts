import { IsObject } from 'class-validator';

export class UpdatePromptsDto {
  @IsObject()
  customPrompts: Record<string, unknown>;
}
