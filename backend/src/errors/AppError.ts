//Un error nuestro que podemos lanzar desde cualquier parte de la app para que el middleware de errores lo maneje y devuelva un mensaje al cliente.

export class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;

    constructor(statusCode: number, code: string, message: string, details?: unknown) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }   
}