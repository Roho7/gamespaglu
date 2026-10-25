import { permanentRedirect } from "next/navigation";

/** The door is /tiktiki/new, matching the other room games. */
export default function TiktikiIndex() {
  permanentRedirect("/tiktiki/new");
}
