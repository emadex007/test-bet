// What the active industry pack adds beyond settings: its own home page, its collections and its dashboard menu.
import PACK from "~/packs/active";
import type { CollectionDef } from "~/packs/collections";

export const PACK_HOME = PACK.home ?? "";
export const COLLECTIONS: CollectionDef[] = PACK.collections ?? [];
export const PACK_ADMIN = PACK.admin ?? {};
export const collectionOf = (kind: string) => COLLECTIONS.find((c) => c.kind === kind);
