import { permanentRedirect } from "next/navigation";

/** The door is /secret-hitler/new, matching the other room games. */
export default function SecretHitlerIndex() {
  permanentRedirect("/secret-hitler/new");
}
