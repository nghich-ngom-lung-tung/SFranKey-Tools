import type { NetworkCapabilities } from "@sfrankey/shared";
import { handleApiSuccess } from "@/server/network/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = process.env.NETWORK_TOOLS_ENABLED !== "false";
  const data: NetworkCapabilities = {
    ipInfoBasic: enabled && (Boolean(process.env.IPINFO_TOKEN) || true),
    privacyDetection: enabled && (Boolean(process.env.IPINFO_TOKEN) || true),
    ipv4Endpoint: Boolean(process.env.NETWORK_IPV4_ENDPOINT),
    ipv6Endpoint: Boolean(process.env.NETWORK_IPV6_ENDPOINT),
    dnsLookup: enabled,
    dnsLeakProbe: enabled && Boolean(process.env.PROBE_CONTROL_URL && process.env.PROBE_CONTROL_TOKEN),
    webRtcStun: Boolean(process.env.NETWORK_STUN_URL),
    tlsProbe: enabled,
    httpProbe: enabled,
  };
  return handleApiSuccess(data);
}
