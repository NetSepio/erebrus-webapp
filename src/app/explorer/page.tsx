import { redirect } from "next/navigation";

/** Public network explorer lives on the VPN connect view. */
export default function ExplorerRedirect() {
  redirect("/connect");
}