import { IUser } from '../../user/models/User.js';
import { IToken } from '../models/Token.js';

export interface IRegisterInput {
    name: string;
    email: string;
    password: string;
    age: number;
    [key: string]: any;
}

export interface ILoginResponse {
    user: IUser;
    token: string;
}

export interface IVerifyEmailResponse {
    user: IUser;
    token: string;
}

export type { IToken };
