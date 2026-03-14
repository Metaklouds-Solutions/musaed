import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Represents a Retell API failure with safe metadata for controllers/services.
 */
export class RetellApiException extends HttpException {
  readonly retriable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = HttpStatus.BAD_GATEWAY,
    retriable = false,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        message,
        source: 'retell',
        retriable,
      },
      statusCode,
    );
    this.retriable = retriable;
    this.details = details;
  }
}
