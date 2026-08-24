import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const saved = (await cookies()).get("sfrankey-locale")?.value;
  if (saved === "vi" || saved === "en") redirect(`/${saved}`);
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  redirect(acceptLanguage.toLowerCase().startsWith("en") ? "/en" : "/vi");
}
