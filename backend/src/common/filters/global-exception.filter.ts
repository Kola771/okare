import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
// @types/express non installé sur Node 16 — typage inline
interface Req { method: string; url: string }
interface Res { status(code: number): Res; json(body: unknown): void }

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Non authentifié',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  409: 'Conflit',
  422: 'Données non traitables',
  429: 'Trop de requêtes',
  500: 'Erreur interne du serveur',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Res>();
    const req = ctx.getRequest<Req>();

    let status: number;
    let body: { code: string; message: string | string[]; details?: unknown };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        body = {
          code: HttpStatus[status] ?? 'ERROR',
          message: payload,
        };
      } else if (typeof payload === 'object' && payload !== null) {
        const p = payload as Record<string, unknown>;
        body = {
          code: (p.code as string) ?? HttpStatus[status] ?? 'ERROR',
          message: (p.message as string | string[]) ?? STATUS_MESSAGES[status] ?? 'Erreur',
          ...(p.details ? { details: p.details } : {}),
        };
      } else {
        body = {
          code: HttpStatus[status] ?? 'ERROR',
          message: STATUS_MESSAGES[status] ?? 'Erreur',
        };
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        code: 'INTERNAL_ERROR',
        message: 'Erreur interne du serveur',
      };
      this.logger.error(
        `${req.method} ${req.url} — exception non gérée`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json(body);
  }
}
