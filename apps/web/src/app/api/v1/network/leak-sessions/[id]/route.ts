import { ApiError } from "@/server/network/api-error";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { deleteLeakSession, getLeakSession } from "@/server/network/network-provider";

export const dynamic = "force-dynamic";

function getReadToken(req: Request) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("x-read-token");
  if (!auth || auth.length > 256) throw new ApiError(401, "SESSION_EXPIRED", "The leak session is unavailable.");
  return auth;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_-]{16,128}$/.test(id)) {
      throw new ApiError(400, "SESSION_EXPIRED", "The leak session is unavailable.");
    }
    const token = getReadToken(req);
    const result = await getLeakSession(id, token);
    return handleApiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_-]{16,128}$/.test(id)) {
      throw new ApiError(400, "SESSION_EXPIRED", "The leak session is unavailable.");
    }
    const token = getReadToken(req);
    await deleteLeakSession(id, token);
    return handleApiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
