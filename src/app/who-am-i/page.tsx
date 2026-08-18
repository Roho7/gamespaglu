import { permanentRedirect } from "next/navigation";

/**
 * The home page is the category picker now, so this middle step is gone.
 * Kept as a redirect because the route was already linked and shared.
 */
export default function WhoAmIIndex() {
  permanentRedirect("/");
}
