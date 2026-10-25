import { permanentRedirect } from "next/navigation";

/** The door is /mafia/new, matching Girgit. */
export default function MafiaIndex() {
  permanentRedirect("/mafia/new");
}
