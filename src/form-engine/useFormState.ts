import { useCallback, useEffect, useState } from "react";
import type { FormState } from "../bods/assembler";

const STORAGE_KEY = "bods-forms:state:v1";

function readInitialState(): FormState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FormState;
  } catch {
    return {};
  }
}

export function useFormState() {
  const [state, setState] = useState<FormState>(() => readInitialState());

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // sessionStorage unavailable or full — fall through silently
    }
  }, [state]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({});
  }, []);

  return { state, setField, setState, reset };
}
