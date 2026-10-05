// Demo wallet for betting and trading sites in demo mode: fake money kept in this visitor's browser only.
import { useCallback, useEffect, useState } from "react";

const KEY = "emadex-demo-wallet";

export type DemoWallet<T> = { balance: number; extra: T };

function read<T>(start: number, extra: T): DemoWallet<T> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const w = JSON.parse(raw);
      if (typeof w?.balance === "number") return { balance: w.balance, extra: { ...extra, ...(w.extra ?? {}) } };
    }
  } catch {
    /* private window or blocked storage: start fresh */
  }
  return { balance: start, extra };
}

/** A fake balance plus any extra state (open bets, coin holdings), saved between visits when the browser allows. */
export function useDemoWallet<T>(start: number, initialExtra: T) {
  const [w, setW] = useState<DemoWallet<T>>({ balance: start, extra: initialExtra });
  useEffect(() => setW(read(start, initialExtra)), [start]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useCallback((next: DemoWallet<T>) => {
    setW(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* fine: the demo still works for this visit */
    }
  }, []);
  const reset = useCallback(() => save({ balance: start, extra: initialExtra }), [start, save]); // eslint-disable-line react-hooks/exhaustive-deps
  return { wallet: w, save, reset };
}

export const money = (currency: string, n: number, digits = 2) =>
  `${currency}${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const code = (len = 7) => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
};
