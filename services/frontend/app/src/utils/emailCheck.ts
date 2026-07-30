import { ErrorType } from "./errors";

export function getValidEmail(email: string): string | ErrorType
{
    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0)
        return ErrorType.emailCannotBeEmpty;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
        return ErrorType.invalidEmail;

    return trimmedEmail;
}
