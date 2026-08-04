export interface RegisterDto {
    name: string;
    email: string;
    password: string;
    age: number;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface VerifyEmailDto {
    token: string;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    token: string;
    newPassword: string;
}
