declare module 'passport-jwt' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptionsWithoutRequest {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey?: string | Buffer;
    issuer?: string;
    audience?: string | string[];
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: false;
  }

  export interface StrategyOptionsWithRequest {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey?: string | Buffer;
    issuer?: string;
    audience?: string | string[];
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback: true;
  }

  export type JwtFromRequestFunction = (req: unknown) => string | null;

  export class Strategy extends PassportStrategy {
    constructor(opt: StrategyOptionsWithoutRequest | StrategyOptionsWithRequest, verify: (...args: unknown[]) => void);
  }

  export namespace ExtractJwt {
    function fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
    function fromHeader(header_name: string): JwtFromRequestFunction;
    function fromBodyField(field_name: string): JwtFromRequestFunction;
    function fromUrlQueryParameter(param_name: string): JwtFromRequestFunction;
    function fromAuthHeaderWithScheme(auth_scheme: string): JwtFromRequestFunction;
    function fromExtractors(extractors: JwtFromRequestFunction[]): JwtFromRequestFunction;
  }
}
