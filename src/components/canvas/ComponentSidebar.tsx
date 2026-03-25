import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  BookPlus,
  Cable,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulation-store';
import type { ComponentType } from '../../types/types';
import { BREAKER_RATINGS, COMPONENT_INFO } from '../../types/types';
import { calculateComponentCurrent, selectCableSize } from '../../engine/nbr5410-engine';

const ORDERABLE_TYPES: ComponentType[] = ['breaker1P', 'breaker2P', 'breaker3P', 'idr', 'contactor', 'dps'];
const LOAD_EDITABLE_TYPES = new Set<ComponentType>(['breaker1P', 'breaker2P', 'breaker3P', 'contactor']);

type SidebarTab = 'library' | 'inspector' | 'diagnostics';

const tabLabels: Array<{ id: SidebarTab; label: string; icon: typeof LayoutGrid }> = [
  { id: 'library', label: 'Biblioteca', icon: BookPlus },
  { id: 'inspector', label: 'Inspector', icon: SlidersHorizontal },
  { id: 'diagnostics', label: 'Diagnosticos', icon: Sparkles },
];

export function ComponentSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('library');
  const {
    components,
    totalPowerW,
    totalCurrentA,
    mainBreakerOn,
    addComponent,
    removeComponent,
    selectedComponentId,
    selectComponent,
    getDesignInfo,
    updateComponentLoad,
    updateComponentRating,
  } = useSimulationStore();

  const selectedComponent = components.find((component) => component.id === selectedComponentId) ?? null;
  const designInfo = selectedComponent ? getDesignInfo(selectedComponent.id) : null;
  const supportsLoad = selectedComponent ? LOAD_EDITABLE_TYPES.has(selectedComponent.type) : false;
  const isOverloaded = Boolean(selectedComponent && designInfo && designInfo.designCurrent > selectedComponent.rating);

  useEffect(() => {
    if (selectedComponentId) {
      setActiveTab('inspector');
    }
  }, [selectedComponentId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const syncSidebarState = (event?: MediaQueryList | MediaQueryListEvent) => {
      if ((event ?? mediaQuery).matches) {
        setIsOpen(true);
      }
    };

    syncSidebarState();
    mediaQuery.addEventListener('change', syncSidebarState);

    return () => mediaQuery.removeEventListener('change', syncSidebarState);
  }, []);

  const alerts: string[] = [];
  if (components.length > 0 && !components.some((component) => component.type === 'idr')) {
    alerts.push('IDR obrigatorio nao encontrado para a composicao atual.');
  }
  if (components.length > 0 && !components.some((component) => component.type === 'dps')) {
    alerts.push('DPS recomendado nao encontrado.');
  }
  if (totalCurrentA > 63) {
    alerts.push('Corrente total acima de 63A. Revise o disjuntor geral e a distribuicao dos circuitos.');
  }

  components.forEach((component) => {
    if (component.loadWatts > 0 && component.state === 'ON') {
      const current = calculateComponentCurrent(component.loadWatts, component.poles);
      if (current > component.rating) {
        alerts.push(`Sobrecarga em ${component.label}: Ib ${current.toFixed(1)}A > In ${component.rating}A.`);
      }
    }
  });

  const shoppingList = components.reduce((acc, component) => {
    const suffix = component.type === 'dps' ? 'kA' : 'A';
    const key = `${COMPONENT_INFO[component.type].label} ${component.rating}${suffix}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {!isOpen && (
        <motion.button
          className="absolute right-0 top-1/2 z-50 hidden -translate-y-1/2 rounded-l-2xl border border-r-0 border-panel-border bg-panel-surface/95 p-3 shadow-panel backdrop-blur hover:bg-panel-card lg:block"
          onClick={() => setIsOpen(true)}
          initial={{ x: 42 }}
          animate={{ x: 0 }}
        >
          <ChevronLeft size={18} className="text-panel-muted" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-panel-border glass-panel shadow-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 210 }}
          >
            <div className="border-b border-panel-border/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-panel-muted">Control Center</div>
                  <h2 className="mt-2 text-lg font-semibold text-panel-text">
                    {selectedComponent ? selectedComponent.label : 'Biblioteca e diagnosticos'}
                  </h2>
                  <p className="mt-1 text-sm text-panel-muted">
                    Painel contextual para adicionar modulos, ajustar parametros e acompanhar riscos.
                  </p>
                </div>

                <button onClick={() => setIsOpen(false)} className="hidden rounded-xl p-2 transition-colors hover:bg-white/5 lg:block">
                  <ChevronRight size={18} className="text-panel-muted" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-2">
                <div className="rounded-2xl border border-panel-border bg-panel-bg/70 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted">
                    <Zap size={12} />
                    Potencia
                  </div>
                  <div className="mt-2 text-lg font-semibold text-panel-text">{totalPowerW.toLocaleString()}W</div>
                </div>

                <div className="rounded-2xl border border-panel-border bg-panel-bg/70 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted">
                    <Cable size={12} />
                    Corrente
                  </div>
                  <div className="mt-2 text-lg font-semibold text-panel-text">{totalCurrentA}A</div>
                </div>

                <div className="rounded-2xl border border-panel-border bg-panel-bg/70 p-3">
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted">Modulos</div>
                  <div className="mt-2 text-lg font-semibold text-panel-text">{components.length}</div>
                </div>

                <div
                  className={`rounded-2xl border p-3 ${
                    mainBreakerOn
                      ? 'border-energy-on/20 bg-energy-on/10'
                      : 'border-red-400/20 bg-red-500/10'
                  }`}
                >
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted">Estado global</div>
                  <div className={`mt-2 text-sm font-semibold ${mainBreakerOn ? 'text-energy-on' : 'text-red-200'}`}>
                    {mainBreakerOn ? 'Energizado' : 'Em espera'}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-panel-border bg-panel-bg/70 p-1">
                {tabLabels.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-medium transition-all sm:px-3 ${
                      activeTab === id
                        ? 'bg-panel-card text-panel-text shadow-inner-glow'
                        : 'text-panel-muted hover:bg-white/5 hover:text-panel-text'
                    }`}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon size={14} />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-2xl border border-panel-border bg-panel-surface/70 p-4">
                      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">Adicionar modulo</div>
                      <p className="mt-2 text-sm leading-relaxed text-panel-muted">
                        A biblioteca agora fica separada da inspeccao. O objetivo aqui e acelerar insercao sem poluir
                        o painel de analise.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {ORDERABLE_TYPES.map((type) => {
                        const info = COMPONENT_INFO[type];
                        return (
                          <motion.button
                            key={type}
                            className="rounded-[22px] border border-panel-border bg-panel-surface p-4 text-left transition-colors hover:border-energy-on/30 hover:bg-energy-on/5"
                            onClick={() => addComponent(type)}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-mono font-bold text-black shadow-lg"
                              style={{ backgroundColor: info.color }}
                            >
                              {info.shortLabel}
                            </div>

                            <div className="mt-4 text-sm font-semibold text-panel-text">{info.label}</div>
                            <div className="mt-1 text-xs text-panel-muted">
                              {info.defaultRating}
                              {type === 'dps' ? 'kA' : 'A'} • {info.dinModules} mod
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'inspector' && (
                  <motion.div
                    key="inspector"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {selectedComponent ? (
                      <>
                        <div
                          className={`rounded-[24px] border bg-panel-surface p-4 ${
                            isOverloaded ? 'border-red-400/40 shadow-glow-red' : 'border-panel-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                                Modulo selecionado
                              </div>
                              <h3 className="mt-2 text-lg font-semibold text-panel-text">{selectedComponent.label}</h3>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-panel-muted">
                                <span className="rounded-full border border-panel-border bg-panel-bg/70 px-2 py-1">
                                  {selectedComponent.poles} polos
                                </span>
                                <span className="rounded-full border border-panel-border bg-panel-bg/70 px-2 py-1">
                                  Estado {selectedComponent.state}
                                </span>
                                <span className="rounded-full border border-panel-border bg-panel-bg/70 px-2 py-1">
                                  {selectedComponent.rating}
                                  {selectedComponent.type === 'dps' ? 'kA' : 'A'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                removeComponent(selectedComponent.id);
                                selectComponent(null);
                              }}
                              className="rounded-xl p-2 transition-colors hover:bg-red-500/15"
                            >
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>

                          {isOverloaded && designInfo && (
                            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                              Ib {designInfo.designCurrent}A acima de In {selectedComponent.rating}A. O auto-trip pode
                              ocorrer em ate 2s.
                            </div>
                          )}
                        </div>

                        {supportsLoad && (
                          <div className="rounded-[24px] border border-panel-border bg-panel-surface p-4">
                            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                              Ajustes de carga
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-panel-muted">Carga conectada</span>
                                <span className="font-semibold text-panel-text">{selectedComponent.loadWatts}W</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={10000}
                                step={100}
                                value={selectedComponent.loadWatts}
                                onChange={(event) => updateComponentLoad(selectedComponent.id, Number(event.target.value))}
                                className="mt-3 h-1.5 w-full cursor-pointer accent-energy-on"
                              />
                            </div>
                          </div>
                        )}

                        {selectedComponent.type !== 'dps' && (
                          <div className="rounded-[24px] border border-panel-border bg-panel-surface p-4">
                            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                              Protecao nominal
                            </div>
                            <select
                              value={selectedComponent.rating}
                              onChange={(event) => updateComponentRating(selectedComponent.id, Number(event.target.value))}
                              className="load-input mt-4 w-full py-2"
                            >
                              {BREAKER_RATINGS.map((rating) => (
                                <option key={rating} value={rating}>
                                  {rating}A
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedComponent.type === 'idr' && (
                          <div className="rounded-[24px] border border-panel-border bg-panel-surface p-4">
                            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                              Parametro diferencial
                            </div>
                            <div className="mt-3 text-sm text-panel-text">
                              Sensibilidade configurada: {selectedComponent.sensitivity ?? 30}mA
                            </div>
                          </div>
                        )}

                        {selectedComponent.type === 'dps' && (
                          <div className="rounded-[24px] border border-panel-border bg-panel-surface p-4">
                            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                              Protecao contra surtos
                            </div>
                            <div className="mt-3 text-sm text-panel-text">
                              Classe {selectedComponent.dpsClass ?? 'II'} com capacidade nominal de {selectedComponent.rating}kA.
                            </div>
                          </div>
                        )}

                        {designInfo ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-panel-border bg-panel-bg/70 p-4">
                              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted">
                                Corrente
                              </div>
                              <div className={`mt-2 text-lg font-semibold ${isOverloaded ? 'text-red-300' : 'text-panel-text'}`}>
                                {designInfo.designCurrent}A
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-panel-border bg-panel-bg/70 p-4">
                              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted">
                                Cabo
                              </div>
                              <div className="mt-2 text-lg font-semibold text-energy-on">{designInfo.cableSizeMm2}mm2</div>
                            </div>

                            <div className="col-span-2 rounded-[22px] border border-panel-border bg-panel-bg/70 p-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-panel-muted">Queda de tensao</span>
                                <span
                                  className={`font-semibold ${
                                    designInfo.voltageDropColor === 'green'
                                      ? 'text-energy-on'
                                      : designInfo.voltageDropColor === 'yellow'
                                        ? 'text-yellow-300'
                                        : 'text-red-300'
                                  }`}
                                >
                                  {designInfo.voltageDrop}%
                                </span>
                              </div>

                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel-border">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor:
                                      designInfo.voltageDropColor === 'green'
                                        ? '#00E676'
                                        : designInfo.voltageDropColor === 'yellow'
                                          ? '#FFD600'
                                          : '#FF1744',
                                  }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (designInfo.voltageDrop / 7) * 100)}%` }}
                                  transition={{ duration: 0.45 }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-panel-border bg-panel-surface/60 p-4 text-sm leading-relaxed text-panel-muted">
                            {supportsLoad
                              ? 'Defina uma carga maior que zero para gerar corrente, cabo recomendado e queda de tensao.'
                              : 'Este modulo nao possui carga associada. O inspector continua contextual, mas o dimensionamento eletrico nao se aplica aqui.'}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-panel-border bg-panel-surface/60 p-6 text-center">
                        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-panel-muted">Nenhum modulo ativo</div>
                        <h3 className="mt-3 text-xl font-semibold text-panel-text">Selecione um componente no trilho</h3>
                        <p className="mt-2 text-sm leading-relaxed text-panel-muted">
                          O inspector agora e dedicado a configuracao contextual. Sem selecao, vale ir para a biblioteca
                          ou revisar os diagnosticos.
                        </p>

                        <div className="mt-5 flex justify-center gap-3">
                          <button className="btn-primary" onClick={() => setActiveTab('library')}>
                            Abrir biblioteca
                          </button>
                          <button
                            className="rounded-xl border border-panel-border bg-panel-bg/70 px-4 py-2 text-sm font-medium text-panel-text transition-colors hover:border-energy-on/30 hover:bg-energy-on/5"
                            onClick={() => setActiveTab('diagnostics')}
                          >
                            Ver diagnosticos
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'diagnostics' && (
                  <motion.div
                    key="diagnostics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                      <div className="rounded-[24px] border border-panel-border bg-panel-surface p-4">
                        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">Leitura do quadro</div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-panel-border bg-panel-bg/70 p-3 text-center">
                          <div className="text-xs text-panel-muted">Alertas</div>
                          <div className="mt-2 text-lg font-semibold text-panel-text">{alerts.length}</div>
                        </div>
                        <div className="rounded-2xl border border-panel-border bg-panel-bg/70 p-3 text-center">
                          <div className="text-xs text-panel-muted">Itens</div>
                          <div className="mt-2 text-lg font-semibold text-panel-text">{components.length}</div>
                        </div>
                        <div className="rounded-2xl border border-panel-border bg-panel-bg/70 p-3 text-center">
                          <div className="text-xs text-panel-muted">Compras</div>
                          <div className="mt-2 text-lg font-semibold text-panel-text">{Object.keys(shoppingList).length}</div>
                        </div>
                      </div>
                    </div>

                    {alerts.length > 0 ? (
                      <div className="space-y-2">
                        {alerts.map((alert) => (
                          <div
                            key={alert}
                            className="flex items-start gap-3 rounded-[20px] border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100"
                          >
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-300" />
                            <span className="leading-relaxed">{alert}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-energy-on/20 bg-energy-on/10 p-4 text-sm text-energy-on">
                        Sem alertas ativos. A composicao atual esta coerente para esta simulacao.
                      </div>
                    )}

                    {Object.keys(shoppingList).length > 0 && (
                      <div className="rounded-[24px] border border-panel-border bg-panel-surface p-4">
                        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                          <ShoppingCart size={13} />
                          Lista de compras
                        </div>

                        <div className="mt-4 space-y-2">
                          {Object.entries(shoppingList).map(([item, quantity]) => (
                            <div
                              key={item}
                              className="flex items-center justify-between rounded-2xl border border-panel-border bg-panel-bg/70 px-3 py-2 text-sm"
                            >
                              <span className="text-panel-text">{item}</span>
                              <span className="rounded-full bg-panel-surface px-2 py-1 text-xs text-panel-muted">x{quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 border-t border-panel-border pt-4">
                          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">Cabos sugeridos</div>
                          <div className="mt-3 space-y-2">
                            {components
                              .filter((component) => component.loadWatts > 0)
                              .map((component) => {
                                const current = calculateComponentCurrent(component.loadWatts, component.poles);
                                const cable = selectCableSize(current, component.poles >= 3 ? 3 : 2);
                                return (
                                  <div
                                    key={component.id}
                                    className="flex items-center justify-between rounded-2xl border border-panel-border bg-panel-bg/70 px-3 py-2 text-sm"
                                  >
                                    <span className="text-panel-text">
                                      {component.label}: cabo {cable}mm2
                                    </span>
                                    <span className="text-panel-muted">15m</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
