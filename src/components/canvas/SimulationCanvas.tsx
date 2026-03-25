import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ChevronLeft, ChevronRight, GripVertical, LayoutGrid, Move, Trash2 } from 'lucide-react';
import { useSimulationStore } from '../../store/simulation-store';
import { DINComponentRenderer } from '../din/DINComponentRenderer';
import { MainBreakerFisico } from '../din/MainBreakerFisico';
import { WireRenderer } from '../wiring/WireRenderer';
import {
  buildCanvasScene,
  CANVAS_FRAME_PADDING_BOTTOM,
  CANVAS_FRAME_PADDING_TOP,
  CANVAS_FRAME_PADDING_X,
  CANVAS_INNER_OFFSET_X,
  CANVAS_ROW_GAP,
} from './canvas-layout';

export function SimulationCanvas() {
  const {
    components,
    mainBreakerOn,
    toggleMainBreaker,
    addComponent,
    selectComponent,
    removeComponent,
    selectedComponentId,
    moveComponent,
  } = useSimulationStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  const slotWidth = 90;
  const canvasWidth = Math.max(400, (components.length + 2) * slotWidth);
  const scene = buildCanvasScene(canvasWidth, components);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (dragIndex !== null && index !== dragIndex) {
        setDragOverIndex(index);
      }
    },
    [dragIndex],
  );

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      moveComponent(dragIndex, dragOverIndex);
    }

    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, moveComponent]);

  useEffect(() => {
    if (dragIndex === null) return;

    const onUp = () => handleDragEnd();
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, [dragIndex, handleDragEnd]);

  const handleDelete = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation();
      removeComponent(id);
    },
    [removeComponent],
  );

  const handleMoveLeft = useCallback(
    (event: React.MouseEvent, index: number) => {
      event.stopPropagation();
      if (index > 0) moveComponent(index, index - 1);
    },
    [moveComponent],
  );

  const handleMoveRight = useCallback(
    (event: React.MouseEvent, index: number) => {
      event.stopPropagation();
      if (index < components.length - 1) moveComponent(index, index + 1);
    },
    [moveComponent, components.length],
  );

  return (
    <div className="relative flex-1 overflow-hidden bg-dot-pattern" onClick={() => selectComponent(null)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,230,118,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(68,138,255,0.10),transparent_28%)]" />

      <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-col gap-3">
        <div className="glass-panel rounded-2xl border border-panel-border/70 px-4 py-3 shadow-panel">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-panel-muted">
            <LayoutGrid size={12} />
            Painel de montagem
          </div>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-panel-text">
            Navegue com arraste e zoom, selecione um modulo para inspecionar e use o disjuntor geral fisico para energizar o quadro.
          </p>
        </div>

        <div className="glass-panel rounded-full border border-panel-border/70 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-panel-muted shadow-panel">
          <span className={mainBreakerOn ? 'text-energy-on' : 'text-red-300'}>
            {mainBreakerOn ? 'Energia disponivel' : 'Quadro desenergizado'}
          </span>
        </div>
      </div>

      <TransformWrapper
        initialScale={0.92}
        minScale={0.4}
        maxScale={2.5}
        centerOnInit
        panning={{
          disabled: dragIndex !== null,
          velocityDisabled: true,
        }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <div
            className="relative mx-auto my-16 flex min-h-[540px] items-center justify-center overflow-hidden rounded-[32px] border border-panel-border/80 bg-[linear-gradient(180deg,#181b23_0%,#11131a_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            style={{
              minWidth: scene.frameWidth,
              paddingLeft: CANVAS_FRAME_PADDING_X,
              paddingRight: CANVAS_FRAME_PADDING_X,
              paddingTop: CANVAS_FRAME_PADDING_TOP,
              paddingBottom: CANVAS_FRAME_PADDING_BOTTOM,
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,0.18))]" />

            <WireRenderer scene={scene} mainBreakerOn={mainBreakerOn} />

            <div className="relative z-10 w-full">
              <div className="mb-8 flex items-end justify-between gap-6" style={{ paddingLeft: CANVAS_INNER_OFFSET_X }}>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-panel-muted">
                    Canvas principal
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-panel-text">Trilho DIN em contexto</h2>
                </div>

                <div className="glass-panel rounded-2xl border border-panel-border/70 px-4 py-3 shadow-panel">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-panel-muted">
                    <Move size={12} />
                    Reordenacao
                  </div>
                  <p className="mt-2 text-sm text-panel-text">
                    As acoes de mover e remover aparecem ao passar o cursor ou selecionar um modulo.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start" style={{ gap: CANVAS_ROW_GAP, paddingLeft: CANVAS_INNER_OFFSET_X }}>
                <div className="relative z-20 mt-2 flex flex-col items-center">
                  <MainBreakerFisico isOn={mainBreakerOn} onToggle={toggleMainBreaker} />
                </div>

                <div className="relative mt-[52px] flex flex-1 flex-col items-start">
                  <div
                    className="din-rail relative h-4 rounded-full shadow-inner"
                    style={{ width: canvasWidth, backgroundColor: '#c8cbd0' }}
                  >
                    <div className="absolute inset-x-2 top-1 bottom-1 rounded-full bg-black/10" />

                    {Array.from({ length: Math.floor(canvasWidth / 18) }).map((_, index) => (
                      <div
                        key={index}
                        className="absolute top-0 h-full"
                        style={{
                          left: index * 18,
                          width: 1,
                          backgroundColor: 'rgba(0,0,0,0.15)',
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-start gap-2 -mt-4" style={{ transform: 'translateY(-2px)' }}>
                    {components.length === 0 ? (
                      <motion.div
                        className="mt-6 w-[360px] rounded-[28px] border border-dashed border-panel-border bg-panel-surface/70 p-6 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-panel-muted">
                          Estado inicial
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-panel-text">Comece pelo primeiro circuito</h3>
                        <p className="mt-2 text-sm leading-relaxed text-panel-muted">
                          Em vez de esconder a acao dentro do inspector, o canvas agora oferece atalhos para iniciar a
                          montagem e reduzir a carga cognitiva.
                        </p>

                        <div className="mt-5 flex gap-3">
                          <button className="btn-primary" onClick={(event) => {
                            event.stopPropagation();
                            addComponent('breaker1P');
                          }}>
                            Adicionar disjuntor 1P
                          </button>

                          <button
                            className="rounded-xl border border-panel-border bg-panel-bg/70 px-4 py-2 text-sm font-medium text-panel-text transition-colors hover:border-energy-on/30 hover:bg-energy-on/5"
                            onClick={(event) => {
                              event.stopPropagation();
                              addComponent('idr');
                            }}
                          >
                            Inserir IDR
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      components.map((component, index) => {
                        const isSelected = selectedComponentId === component.id;
                        const isDragging = dragIndex === index;
                        const isDragTarget = dragOverIndex === index;
                        const isHovered = hoveredComponentId === component.id;
                        const showActions = isSelected || isDragTarget || isHovered;

                        return (
                          <motion.div
                            key={component.id}
                            className="relative"
                            initial={{ opacity: 0, y: -20, scale: 0.88 }}
                            animate={{
                              opacity: isDragging ? 0.5 : 1,
                              y: 0,
                              scale: isDragTarget ? 1.04 : 1,
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 280,
                              damping: 24,
                              delay: index * 0.04,
                            }}
                            onPointerEnter={() => setHoveredComponentId(component.id)}
                            onPointerLeave={() => setHoveredComponentId((current) => (current === component.id ? null : current))}
                            onPointerOver={() => handleDragOver(index)}
                          >
                            <AnimatePresence>
                              {showActions && (
                                <motion.div
                                  className="absolute -top-11 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-panel-border bg-panel-bg/90 p-1 shadow-xl backdrop-blur"
                                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.92 }}
                                >
                                  {index > 0 && (
                                    <motion.button
                                      className="rounded-lg border border-panel-border bg-panel-surface p-1 hover:border-blue-400/50 hover:bg-blue-400/10"
                                      onClick={(event) => handleMoveLeft(event, index)}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <ChevronLeft size={12} className="text-blue-400" />
                                    </motion.button>
                                  )}

                                  <motion.button
                                    className="cursor-grab rounded-lg border border-panel-border bg-panel-surface p-1 hover:border-panel-muted hover:bg-white/5 active:cursor-grabbing"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                      handleDragStart(index);
                                    }}
                                    whileTap={{ scale: 0.92 }}
                                  >
                                    <GripVertical size={12} className="text-panel-muted" />
                                  </motion.button>

                                  <motion.button
                                    className="rounded-lg border border-panel-border bg-panel-surface p-1 hover:border-red-400/50 hover:bg-red-500/10"
                                    onClick={(event) => handleDelete(event, component.id)}
                                    whileTap={{ scale: 0.92 }}
                                  >
                                    <Trash2 size={12} className="text-red-400" />
                                  </motion.button>

                                  {index < components.length - 1 && (
                                    <motion.button
                                      className="rounded-lg border border-panel-border bg-panel-surface p-1 hover:border-blue-400/50 hover:bg-blue-400/10"
                                      onClick={(event) => handleMoveRight(event, index)}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <ChevronRight size={12} className="text-blue-400" />
                                    </motion.button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {isDragTarget && (
                              <motion.div
                                className="absolute -left-2 top-0 bottom-0 z-50 w-1 rounded-full bg-energy-on shadow-[0_0_10px_rgba(0,230,118,0.55)]"
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                layoutId="drop-indicator"
                              />
                            )}

                            <DINComponentRenderer component={component} />
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
