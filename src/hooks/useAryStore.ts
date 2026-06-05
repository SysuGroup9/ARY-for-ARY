import { useEffect, useMemo, useState } from "react";
import type { AryState } from "../types";
import { loadState, resetState, saveState } from "../lib/storage";

export function useAryStore() {
  const [state, setState] = useState<AryState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const api = useMemo(
    () => ({
      state,
      setState,
      replaceWithSeed() {
        setState(resetState());
      },
    }),
    [state],
  );

  return api;
}
