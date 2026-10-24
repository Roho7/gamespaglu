import { permanentRedirect } from "next/navigation";

/** The door is /girgit/new; this keeps old links and shares working. */
export default function GirgitIndex() {
  permanentRedirect("/girgit/new");
}
