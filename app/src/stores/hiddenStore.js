// src/stores/hiddenStore.js
import { create } from 'zustand';

// Estado en memoria (no persistente) para ocultar elementos durante la sesión
const useHiddenStore = create((set, get) => ({
  hiddenTours: [],
  hiddenTestimonials: [],

  hideTour: (tour) => {
    if (!tour || tour.id == null) return;
    set((state) => {
      const exists = state.hiddenTours.some((t) => t.id === tour.id);
      return exists ? {} : { hiddenTours: [...state.hiddenTours, tour] };
    });
  },
  restoreTour: (id) => {
    set((state) => ({ hiddenTours: state.hiddenTours.filter((t) => t.id !== id) }));
  },

  hideTestimonial: (testimonial) => {
    if (!testimonial || testimonial.id == null) return;
    set((state) => {
      const exists = state.hiddenTestimonials.some((t) => t.id === testimonial.id);
      return exists ? {} : { hiddenTestimonials: [...state.hiddenTestimonials, testimonial] };
    });
  },
  restoreTestimonial: (id) => {
    set((state) => ({ hiddenTestimonials: state.hiddenTestimonials.filter((t) => t.id !== id) }));
  },
}));

export default useHiddenStore;
