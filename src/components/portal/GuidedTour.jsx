import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

const FIND_RETRY_MS = 60;
const FIND_MAX_TRIES = 15;
const WATCH_INTERVAL_MS = 250;

// Tour guiado minimalista para el armador de pedido del portal de clientes.
// El proyecto no tiene ninguna librería de tours instalada, así que esto es
// un overlay + "spotlight" (box-shadow) posicionado con getBoundingClientRect
// sobre el elemento que indique `selector` en cada paso — sin dependencias
// nuevas.
//
// Cada paso puede declarar `setup`/`teardown` + `groupKey` para efectos que
// deben vivir mientras el usuario esté "dentro" de ese grupo de pasos (p. ej.
// forzar la expansión de un día para poder señalar sus botones) — solo se
// vuelven a ejecutar cuando se entra/sale de un grupo distinto, no en cada
// paso, para evitar que el día se colapse y re-expanda entre pasos vecinos.
const GuidedTour = ({ steps, stepIndex, onStepChange, onClose }) => {
  const [rect, setRect] = useState(null);
  const prevStepRef = useRef(null);
  const targetElRef = useRef(null);

  const step = steps[stepIndex] ?? null;

  const measure = useCallback(() => {
    const el = targetElRef.current;
    if (!el) return;
    setRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    const prev = prevStepRef.current;
    if (!prev || prev.groupKey !== step?.groupKey) {
      prev?.teardown?.();
      step?.setup?.();
    }
    prevStepRef.current = step;

    if (!step) return undefined;

    setRect(null);
    targetElRef.current = null;
    let cancelled = false;
    let watchInterval = null;

    const advanceOrClose = () => {
      if (stepIndex < steps.length - 1) onStepChange(stepIndex + 1);
      else onClose();
    };

    let tries = 0;
    const tryFind = () => {
      if (cancelled) return;
      const el =
        typeof step.selector === 'function' ? step.selector() : document.querySelector(step.selector);
      if (el) {
        targetElRef.current = el;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(measure, 250);
        // El usuario puede completar la acción del paso por su cuenta (ej.
        // tocar "Continuar" en el picker de tiempos de comida) en vez de usar
        // los botones del tour — si el elemento señalado desaparece del DOM,
        // se avanza solo en vez de dejar el spotlight apuntando a la nada.
        watchInterval = setInterval(() => {
          if (!targetElRef.current?.isConnected) {
            clearInterval(watchInterval);
            advanceOrClose();
          }
        }, WATCH_INTERVAL_MS);
        return;
      }
      tries += 1;
      if (tries >= FIND_MAX_TRIES) {
        // El elemento no está en el DOM (ej. día bloqueado, sin botón de
        // editar ingredientes) — se salta el paso en vez de trabar el tour.
        advanceOrClose();
        return;
      }
      setTimeout(tryFind, FIND_RETRY_MS);
    };
    tryFind();

    return () => {
      cancelled = true;
      if (watchInterval) clearInterval(watchInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    if (!step) return undefined;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  useEffect(() => {
    // Si el tour se desmonta (cerrado/terminado) deshace el efecto del
    // último grupo de pasos activo.
    return () => {
      prevStepRef.current?.teardown?.();
    };
  }, []);

  if (!step || !rect) return null;

  const isLast = stepIndex === steps.length - 1;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const spaceBelow = viewportH - rect.bottom;
  const placeBelow = spaceBelow > 180 || rect.top < 180;
  const top = placeBelow ? rect.bottom + 12 : undefined;
  const bottom = !placeBelow ? viewportH - rect.top + 12 : undefined;
  const left = Math.min(Math.max(rect.left, 12), viewportW - 12 - 300);

  return (
    // pointer-events-none en todo el overlay: el tour es solo visual, no
    // debe bloquear que el cliente interactúe con la app de verdad debajo
    // (p. ej. tocar "Almuerzo"/"Continuar" en el picker mientras el tour lo
    // señala) — solo la burbuja de texto necesita volver a aceptar clics,
    // para sus propios botones (Atrás/Siguiente/cerrar).
    <div
      className="fixed inset-0 z-[60] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
    >
      <div
        className="fixed rounded-xl pointer-events-none transition-all duration-200"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
          border: '2px solid rgba(16, 185, 129, 0.9)',
        }}
      />
      <div
        className="fixed rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-4 w-[300px] text-sm border border-slate-200 dark:border-slate-700 pointer-events-auto"
        style={{ top, bottom, left }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{step.title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
            aria-label="Cerrar tour"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {stepIndex + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => onStepChange(stepIndex - 1)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 transition"
              >
                <ArrowLeft size={12} /> Atrás
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onClose() : onStepChange(stepIndex + 1))}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition"
            >
              {isLast ? 'Entendido' : 'Siguiente'} {!isLast && <ArrowRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
