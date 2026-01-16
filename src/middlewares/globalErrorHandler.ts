import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails: string | undefined = undefined;
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "you provided incorrect field type";
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;

        errorMessage = "Unique constraint failed";
        errorDetails = err.message;
        break;
      case "P2025":
        statusCode = 404;
        errorMessage = "Record not found";
        errorDetails = err.message;
        break;
      default:
        statusCode = 400;
        errorMessage = "Database error";
        errorDetails = err.message;
        break;
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Unknown database error";
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    switch (err.errorCode) {
      case "P1000":
        statusCode = 401;
        errorMessage = "authentication error";
        errorDetails = err.message;
        break;
      case "P1001":
        statusCode = 503;
        errorMessage = "Database server is not available";
        errorDetails = err.message;
        break;
      default:
        statusCode = 500;
        errorMessage = "Database initialization error";
        errorDetails = err.message;
        break;
    }
  }

  res.status(statusCode).json({
    error: errorMessage,
    details: errorDetails,
  });
}

export default errorHandler;
