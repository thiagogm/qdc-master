import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SimulationCanvas } from './components/canvas/SimulationCanvas';
import { ComponentSidebar } from './components/canvas/ComponentSidebar';
import { useSimulationStore } from './store/simulation-store';
import { AlertTriangle, Cable, Info, LayoutGrid, Power, XCircle, Zap } from 'lucide-react';

function App() {
  const {
    components,
    totalPowerW,
    totalCurrentA,
    mainBreakerOn,
    selectedComponentId,
    uiFeedback,
    clearFeedback,
  } = useSimulationStore();
  const selectedComponent = components.find((component) => component.id === selectedComponentId);

  useEffect(() => {
    if (!uiFeedback) return;

    const timeoutId = window.setTimeout(() => {
      clearFeedback();
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [uiFeedback, clearFeedback]);

  const feedbackIcon =
    uiFeedback?.tone === 'error' ? XCircle : uiFeedback?.tone === 'warning' ? AlertTriangle : Info;
  const FeedbackIcon = feedbackIcon;

  return (
    <div className="h-screen overflow-hidden premium-bg noise-overlay relative text-panel-text">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,230,118,0.08),transparent_38%)] pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="glass-panel border-b border-panel-border/80 px-4 py-3">
          <div className="flex h-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-energy-on/20 bg-energy-on/10 shadow-glow-sm">
                <Zap size={18} className="text-energy-on" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-[0.24em] text-panel-muted uppercase">QDC Master</span>
                  <span className="rounded-full border border-panel-border bg-panel-bg/60 px-2 py-0.5 text-[10px] font-mono text-panel-muted">
                    Studio
                  </span>
                </div>
                <p className="truncate text-sm text-panel-text">
                  {selectedComponent
                    ? `Inspecionando ${selectedComponent.label}`
                    : 'Montagem visual com foco em arquitetura, feedback e simulacao.'}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-2xl border border-panel-border bg-panel-bg/70 px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-panel-muted uppercase">
                  <LayoutGrid size={12} />
                  Modulos
                </div>
                <div className="mt-1 text-base font-semibold text-panel-text">{components.length}</div>
              </div>

              <div className="rounded-2xl border border-panel-border bg-panel-bg/70 px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-panel-muted uppercase">
                  <Power size={12} />
                  Potencia
                </div>
                <div className="mt-1 text-base font-semibold text-panel-text">{totalPowerW.toLocaleString()}W</div>
              </div>

              <div className="rounded-2xl border border-panel-border bg-panel-bg/70 px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-panel-muted uppercase">
                  <Cable size={12} />
                  Corrente
                </div>
                <div className="mt-1 text-base font-semibold text-panel-text">{totalCurrentA}A</div>
              </div>
            </div>

            <div
              className={`rounded-full border px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-[0.18em] ${
                mainBreakerOn
                  ? 'border-energy-on/30 bg-energy-on/10 text-energy-on'
                  : 'border-red-400/30 bg-red-500/10 text-red-300'
              }`}
            >
              {mainBreakerOn ? 'Sistema energizado' : 'Sistema em espera'}
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:gap-4 lg:p-4">
          <section className="relative flex min-h-[54vh] flex-1 overflow-hidden rounded-[28px] border border-panel-border bg-panel-surface/60 shadow-panel lg:min-h-0">
            <SimulationCanvas />
          </section>

          <aside className="w-full max-h-[42vh] shrink-0 lg:w-[360px] lg:min-w-[320px] lg:max-w-[38vw] lg:max-h-none">
            <ComponentSidebar />
          </aside>
        </main>
      </div>

      <AnimatePresence>
        {uiFeedback && (
          <motion.div
            className="pointer-events-none absolute inset-x-3 bottom-3 z-[120] flex justify-center lg:inset-x-auto lg:right-4 lg:top-24 lg:bottom-auto"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
          >
            <div
              className={`pointer-events-auto w-full max-w-md rounded-[24px] border px-4 py-3 shadow-2xl backdrop-blur-xl ${
                uiFeedback.tone === 'error'
                  ? 'border-red-400/30 bg-red-950/85 text-red-50'
                  : uiFeedback.tone === 'warning'
                    ? 'border-yellow-400/30 bg-yellow-950/85 text-yellow-50'
                    : 'border-energy-on/25 bg-panel-surface/95 text-panel-text'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-2xl p-2 ${
                    uiFeedback.tone === 'error'
                      ? 'bg-red-500/20 text-red-200'
                      : uiFeedback.tone === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-200'
                        : 'bg-energy-on/12 text-energy-on'
                  }`}
                >
                  <FeedbackIcon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{uiFeedback.title}</div>
                  <p className="mt-1 text-sm leading-relaxed opacity-90">{uiFeedback.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
