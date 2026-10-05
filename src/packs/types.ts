import type { SettingsOverrides } from "~/lib/site-defaults";
import type { CollectionDef, CorePage } from "./collections";

/**
 * An industry pack: the starting text, form questions, colours and switches for one kind of business.
 * Its sample content (services, projects, FAQs…) lives in packs/<id>/seed.sql at the project root.
 *
 * To add an industry: copy one of the packs in this folder, change what that business needs,
 * add a matching packs/<id>/seed.sql, and it appears in `npm run new-client`.
 */
export type Pack = {
  id: string; // matches the file name and the packs/<id>/ folder
  name: string; // shown in `npm run new-client`
  description: string;
  settings: SettingsOverrides;
  /** The industry's own home page design (src/homes/<home>.tsx). Without one, the standard home page is used. */
  home?: string;
  /** Industry features the dashboard manages, e.g. matches and odds, coins, menu items. */
  collections?: CollectionDef[];
  /** Dashboard menu: hide or rename standard pages for this industry. */
  admin?: { hide?: CorePage[]; rename?: Partial<Record<CorePage, string>> };
};

export const definePack = (p: Pack) => p;
