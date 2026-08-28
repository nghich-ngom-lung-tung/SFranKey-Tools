import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./api-error";

export function handleApiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, requestId: crypto.randomUUID() }, { status });
}

export function handleApiError(error: unknown) {
  const requestId = crypto.randomUUID();
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message, requestId } },
      { status: error.statusCode }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_FAILED", message: error.issues[0]?.message ?? "Invalid payload.", requestId } },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", requestId } },
    { status: 500 }
  );
}
