// Industry home pages. A pack picks one with `home: "<key>"` in src/packs/<id>.ts.
// Site settings → Layout → "Home page design" can switch back to the standard home at any time.
import type { ComponentType } from "react";
import type { HomeData } from "./types";
import { BettingHome } from "./betting";
import { CryptoHome } from "./crypto";

export const HOMES: Record<string, ComponentType<{ data: HomeData }>> = {
  betting: BettingHome,
  crypto: CryptoHome,
};

export type { HomeData };
