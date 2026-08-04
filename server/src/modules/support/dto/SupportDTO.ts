export interface CreateContactQueryDto {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export interface AddMessageDto {
    message: string;
}
