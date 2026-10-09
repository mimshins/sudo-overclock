import { renderOgCard } from "../../og-card.tsx";
import { PAGES } from "../../pages.ts";

export const dynamic = "force-static";

const GET = (): Promise<Response> => renderOgCard(PAGES.about);

export { GET };
