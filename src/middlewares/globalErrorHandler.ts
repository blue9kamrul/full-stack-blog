import { NextFunction, Request, Response } from "express";

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Global error handler:", err);
  res.status(500).json({
    error: "An unexpected error occurred",

    details: err instanceof Error ? err.message : String(err),
  });
}

export default errorHandler;
