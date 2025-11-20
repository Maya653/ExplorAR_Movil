// src/hooks/useNotificationDetector.js
import { useEffect, useRef } from 'react';
import useCareerStore from '../stores/careerStore';
import useTourStore from '../stores/tourStore';
import useNotificationStore from '../stores/notificationStore';

export const useNotificationDetector = () => {
  const { careers } = useCareerStore();
  const { tours } = useTourStore();
  const { addNotification } = useNotificationStore();

  // Referencias para comparar cambios
  const previousCareersRef = useRef([]);
  const previousToursRef = useRef([]);
  const previousTestimoniosRef = useRef([]);
  const isInitialMount = useRef(true);

  // ✅ Detectar nuevas carreras
  useEffect(() => {
    // Ignorar el primer montaje (carga inicial)
    if (isInitialMount.current) {
      previousCareersRef.current = careers.map(c => c.id || c._id);
      return;
    }

    if (careers.length > previousCareersRef.current.length) {
      const previousIds = new Set(previousCareersRef.current);
      const newCareers = careers.filter(career => 
        !previousIds.has(career.id || career._id)
      );

      newCareers.forEach(career => {
        console.log('🎓 Nueva carrera detectada:', career.title);
        addNotification({
          type: 'new_career',
          title: '🎓 Nueva Carrera Disponible',
          message: `La carrera de ${career.title} ya está disponible para explorar`,
          careerId: career.id || career._id,
        });
      });

      previousCareersRef.current = careers.map(c => c.id || c._id);
    }
  }, [careers, addNotification]);

  // ✅ Detectar nuevos tours
  useEffect(() => {
    // Ignorar el primer montaje (carga inicial)
    if (isInitialMount.current) {
      previousToursRef.current = tours.map(t => t.id || t._id);
      return;
    }

    if (tours.length > previousToursRef.current.length) {
      const previousIds = new Set(previousToursRef.current);
      const newTours = tours.filter(tour => 
        !previousIds.has(tour.id || tour._id)
      );

      newTours.forEach(tour => {
        console.log('🎬 Nuevo tour detectado:', tour.title);
        
        // Buscar la carrera asociada
        const career = careers.find(c => 
          String(c.id || c._id) === String(tour.careerId || tour.career)
        );

        addNotification({
          type: 'new_tour',
          title: '🎬 Nuevo Tour Disponible',
          message: `"${tour.title}"${career ? ` en ${career.title}` : ''} ya está listo para explorar`,
          tourId: tour.id || tour._id,
          careerId: tour.careerId || tour.career,
        });
      });

      previousToursRef.current = tours.map(t => t.id || t._id);
    }
  }, [tours, careers, addNotification]);

  // ✅ NUEVO: Detectar testimonios nuevos
  // Esta función debe ser llamada desde HomeScreen cuando cambien los testimonios
  return {
    checkNewTestimonials: (currentTestimonios) => {
      // Ignorar el primer montaje
      if (isInitialMount.current) {
        previousTestimoniosRef.current = currentTestimonios.map(t => t.id || t._id);
        isInitialMount.current = false;
        return;
      }

      if (currentTestimonios.length > previousTestimoniosRef.current.length) {
        const previousIds = new Set(previousTestimoniosRef.current);
        const newTestimonios = currentTestimonios.filter(testimonio => 
          !previousIds.has(testimonio.id || testimonio._id)
        );

        newTestimonios.forEach(testimonio => {
          const author = testimonio.author || testimonio.autor || 'Un estudiante';
          console.log('💬 Nuevo testimonio detectado de:', author);
          
          addNotification({
            type: 'new_testimonial',
            title: '💬 Nuevo Testimonio',
            message: `${author} compartió su experiencia en ExplorAR`,
            testimonioId: testimonio.id || testimonio._id,
          });
        });

        previousTestimoniosRef.current = currentTestimonios.map(t => t.id || t._id);
      }
    }
  };
};