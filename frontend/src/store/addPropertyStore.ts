import { create } from "zustand";

interface AddPropertyStore {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
}

export const useAddPropertyStore = create<AddPropertyStore>((set) => ({
  isOpen: false,
  open:   () => set({ isOpen: true }),
  close:  () => set({ isOpen: false }),
}));
