"use client";

import { WhatsAppGlyph } from "@/components/whatsapp-brand";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export interface LeaseStepItem {
  step: string;
  title: string;
  description: string;
}

interface LeaseProcessSectionProps {
  steps: readonly LeaseStepItem[];
  whatsappWaitlistUrl: string;
}

function StepIcon({ index, isActive }: { index: number; isActive: boolean }) {
  const iconClass = `h-5 w-5 transition-transform duration-200 motion-reduce:transition-none ${
    isActive ? "scale-105" : ""
  }`;

  switch (index) {
    case 0:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case 1:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    case 2:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      );
  }
}

export function LeaseProcessSection({ steps, whatsappWaitlistUrl }: LeaseProcessSectionProps) {
  const [activeStep, setActiveStep] = useState(0);
  const stepButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const totalSteps = steps.length;
  const progressPercent = ((activeStep + 1) / totalSteps) * 100;

  function selectStep(index: number, focusButton = false) {
    setActiveStep(index);
    if (focusButton) {
      stepButtonRefs.current[index]?.focus();
    }
  }

  function handleStepKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % totalSteps;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + totalSteps) % totalSteps;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = totalSteps - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      selectStep(nextIndex, true);
    }
  }

  const progressStyle = {
    "--step-progress": `${progressPercent}%`,
  } as CSSProperties;

  return (
    <section
      id="proceso"
      className="defer-section scroll-mt-16 border-y border-crema bg-gradient-to-b from-white via-arena/35 to-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" style={progressStyle}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="eyebrow">Trámite Ágil y Transparente</span>
            <h2 className="section-fluid-title mt-2 font-display font-bold text-azul">
              Proceso de arrendamiento en 4 pasos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-piedra sm:text-base">
              Sin burocracia innecesaria: desde el primer contacto hasta la entrega de llaves y activación de tu Portal de Inquilinos.
            </p>
          </div>

          {/* Interactive Step Switcher & Journey Progress Control */}
          <div className="flex flex-col gap-2 self-start rounded-2xl border border-crema bg-arena/80 p-2.5 shadow-2xs sm:flex-row sm:items-center sm:gap-3 lg:self-auto">
            <div
              role="group"
              aria-label="Seleccionar paso del proceso de arrendamiento"
              className="flex items-center gap-1.5"
            >
              {steps.map((item, idx) => {
                const isCurrent = idx === activeStep;
                const isReached = idx <= activeStep;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => selectStep(idx)}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${item.step}: ${item.title}`}
                    className={`inline-flex min-h-9 min-w-11 cursor-pointer items-center justify-center rounded-xl px-2.5 py-1.5 font-mono text-xs font-extrabold transition duration-200 motion-reduce:transition-none ${
                      isCurrent
                        ? "bg-azul text-white shadow-xs ring-2 ring-turquesa/40"
                        : isReached
                          ? "bg-white text-azul ring-1 ring-azul/25 hover:bg-turquesa-claro/50"
                          : "bg-white/70 text-piedra ring-1 ring-crema hover:bg-white hover:text-tinta"
                    }`}
                  >
                    0{idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-crema/80 pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
              <span className="text-xs font-bold text-tinta">
                <span className="font-mono text-azul">0{activeStep + 1}/0{totalSteps}</span>{" "}
                <span className="text-piedra">• {steps[activeStep]?.title}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  aria-label="Paso anterior"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-crema bg-white text-tinta transition hover:border-azul/40 hover:text-azul disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => selectStep(Math.min(totalSteps - 1, activeStep + 1))}
                  disabled={activeStep === totalSteps - 1}
                  aria-label="Siguiente paso"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-crema bg-white text-tinta transition hover:border-azul/40 hover:text-azul disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Continuous Progress Rail */}
        <div className="mt-8 hidden md:block" aria-hidden="true">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-crema/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-azul via-turquesa to-selva transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: "var(--step-progress)" }}
            />
          </div>
        </div>

        {/* 4-Step Connected Journey List */}
        <ol
          role="list"
          className="relative mt-6 grid grid-cols-1 gap-4 md:mt-5 md:grid-cols-4 md:gap-5"
        >
          {steps.map((item, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            const isReached = index <= activeStep;

            return (
              <li
                key={item.step}
                onMouseEnter={() => setActiveStep(index)}
                onFocusCapture={() => setActiveStep(index)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 motion-reduce:transition-none ${
                  isActive
                    ? "border-azul/45 bg-white shadow-md ring-2 ring-azul/15 md:-translate-y-0.5 motion-reduce:transform-none"
                    : isCompleted
                      ? "border-turquesa/35 bg-arena/40 shadow-2xs hover:border-azul/35 hover:bg-white"
                      : "border-crema bg-arena/55 hover:border-azul/30 hover:bg-white hover:shadow-xs"
                }`}
              >
                {/* Top Accent Progress Strip inside Card */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-4 top-0 h-1 rounded-b-full transition-colors duration-200 motion-reduce:transition-none ${
                    isActive
                      ? "bg-gradient-to-r from-azul via-turquesa to-selva"
                      : isCompleted
                        ? "bg-turquesa/60"
                        : "bg-transparent group-hover:bg-crema"
                  }`}
                />

                {/* Desktop Connector Chevron Between Adjacent Cards */}
                {index < totalSteps - 1 && (
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-3.5 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border shadow-2xs transition-colors duration-200 motion-reduce:transition-none md:flex ${
                      isCompleted
                        ? "border-turquesa bg-turquesa text-white"
                        : isActive
                          ? "border-azul bg-azul text-white"
                          : "border-crema bg-white text-piedra"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

                {/* Mobile Vertical Connector Between Stacked Cards */}
                {index < totalSteps - 1 && (
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -bottom-4 left-8 z-10 h-4 w-0.5 transition-colors duration-200 motion-reduce:transition-none md:hidden ${
                      isCompleted ? "bg-turquesa" : "bg-crema"
                    }`}
                  />
                )}

                <div>
                  <button
                    ref={(el) => {
                      stepButtonRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => selectStep(index)}
                    onKeyDown={(e) => handleStepKeyDown(e, index)}
                    aria-current={isActive ? "step" : undefined}
                    className="w-full cursor-pointer rounded-xl text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-turquesa"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 motion-reduce:transition-none ${
                            isActive
                              ? "bg-azul text-white shadow-xs"
                              : isCompleted
                                ? "bg-turquesa-claro text-azul"
                                : "bg-white text-azul ring-1 ring-crema group-hover:bg-turquesa-claro/60"
                          }`}
                        >
                          <StepIcon index={index} isActive={isActive} />
                        </span>
                        <span
                          className={`inline-flex items-center rounded-xl px-3 py-1 font-display text-xs font-bold transition-colors duration-200 motion-reduce:transition-none ${
                            isActive
                              ? "bg-azul text-white"
                              : isCompleted
                                ? "bg-azul/90 text-white"
                                : "bg-azul text-white"
                          }`}
                        >
                          {item.step}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs font-bold transition-colors duration-200 motion-reduce:transition-none ${
                          isActive
                            ? "bg-turquesa-claro/70 text-azul"
                            : "text-piedra"
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive
                              ? "bg-turquesa"
                              : isCompleted
                                ? "bg-selva"
                                : "bg-crema"
                          }`}
                        />
                        0{index + 1}/0{totalSteps}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-bold text-tinta transition-colors group-hover:text-azul">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-piedra">
                      {item.description}
                    </p>
                  </button>
                </div>

                <div className="mt-5 border-t border-crema/80 pt-3.5">
                  {index === 0 ? (
                    <a
                      href={whatsappWaitlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-xl bg-whatsapp/15 px-3.5 py-2 text-xs font-extrabold text-whatsapp-oscuro ring-1 ring-whatsapp/40 transition duration-150 hover:bg-whatsapp hover:shadow-xs active:scale-[0.99] motion-reduce:transition-none"
                    >
                      <span className="inline-flex items-center gap-2">
                        <WhatsAppGlyph variant="green" className="h-4 w-4 shrink-0" size={16} />
                        <span>Escribir por WhatsApp →</span>
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-between gap-3" aria-hidden="true">
                      <div className="flex flex-1 items-center gap-1.5">
                        {steps.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                              dotIdx <= index
                                ? isReached
                                  ? "bg-turquesa"
                                  : "bg-azul/35"
                                : "bg-crema/90"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-piedra">
                        {index === totalSteps - 1 ? "4/4" : `${index + 1}/4`}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
