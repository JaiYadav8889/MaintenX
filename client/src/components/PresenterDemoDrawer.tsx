import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DemoStep = {
  id: string;
  label: string;
  cue: string;
  talkTrack: string;
  href: string;
  actionLabel: string;
  note?: string;
};

const DEMO_STEPS: DemoStep[] = [
  {
    id: "detect",
    label: "01 — DETECT",
    cue: "Show the Command Center and identify the abnormal machine.",
    talkTrack: "MaintenX continuously monitors machine behaviour and detects abnormal patterns before a visible breakdown.",
    href: "/",
    actionLabel: "Open Command Center",
  },
  {
    id: "explain",
    label: "02 — EXPLAIN",
    cue: "Open the affected machine and show the evidence.",
    talkTrack: "Instead of only showing an alert, MaintenX explains which machine signals are contributing to the abnormal condition.",
    href: "/machine/CNC-201",
    actionLabel: "Open machine evidence",
  },
  {
    id: "predict",
    label: "03 — PREDICT",
    cue: "Open Predictive Intelligence.",
    talkTrack: "The system converts the detected degradation into a machine-health and failure-risk assessment.",
    href: "/insights",
    actionLabel: "Open Predictive Intelligence",
  },
  {
    id: "recommend",
    label: "04 — RECOMMEND",
    cue: "Open Maintenance Center.",
    talkTrack: "MaintenX turns the prediction into an actionable maintenance recommendation and priority.",
    href: "/maintenance",
    actionLabel: "Open Maintenance Center",
  },
  {
    id: "simulate",
    label: "05 — SIMULATE",
    cue: "Open What-if Simulator.",
    talkTrack: "Now we can compare the projected scenario with no intervention against the maintenance scenario.",
    href: "/simulation",
    actionLabel: "Open What-if Simulator",
    note: "Scenario projections are simulated, not guaranteed operating outcomes.",
  },
  {
    id: "prevent",
    label: "06 — PREVENT",
    cue: "Show the resulting machine state and maintenance outcome.",
    talkTrack: "The objective is not simply to predict failure. It is to give the maintenance team enough information to act before the failure causes downtime.",
    href: "/machine/MTR-042",
    actionLabel: "Show simulated outcome",
    note: "MTR-042 replay and intervention outcome use controlled demo data.",
  },
];

export default function PresenterDemoDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const step = DEMO_STEPS[activeStep];

  const selectStep = (index: number) => {
    setActiveStep(Math.max(0, Math.min(DEMO_STEPS.length - 1, index)));
  };

  return (
    <>
      {isOpen && (
        <section
          id="presenter-demo-drawer"
          role="dialog"
          aria-label="Presenter Demo Guide"
          className="fixed right-4 bottom-20 z-50 w-[min(22rem,calc(100vw-2rem))] max-h-[min(34rem,calc(100vh-7rem))] overflow-y-auto rounded-lg border border-amber-500/35 bg-slate-950 shadow-2xl shadow-black/40"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">Presenter Mode</div>
                <div className="font-mono text-[10px] text-slate-500">Demo Guide · {activeStep + 1}/{DEMO_STEPS.length}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Presenter Demo Guide"
              className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-6 gap-1" aria-label="Demo steps">
              {DEMO_STEPS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectStep(index)}
                  aria-label={`Go to ${item.label}`}
                  aria-current={activeStep === index ? "step" : undefined}
                  className={`h-1.5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${activeStep === index ? "bg-amber-400" : index < activeStep ? "bg-slate-600" : "bg-slate-800 hover:bg-slate-700"}`}
                />
              ))}
            </div>

            <div className="space-y-3">
              <div className="font-mono text-xs font-bold tracking-wider text-amber-300">{step.label}</div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Cue</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{step.cue}</p>
              </div>
              <div className="border-l-2 border-amber-500/60 pl-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Talk track</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">“{step.talkTrack}”</p>
              </div>
              {step.note && <p className="rounded border border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px] leading-relaxed text-slate-500">{step.note}</p>}
            </div>

            <Link
              href={step.href}
              onClick={() => setIsOpen(false)}
              className="flex min-h-10 items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {step.actionLabel}
            </Link>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeStep === 0}
                onClick={() => selectStep(activeStep - 1)}
                className="h-9 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
              </Button>
              <span className="font-mono text-[10px] text-slate-500">{activeStep + 1} of {DEMO_STEPS.length}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeStep === DEMO_STEPS.length - 1}
                onClick={() => selectStep(activeStep + 1)}
                className="h-9 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="presenter-demo-drawer"
        className={`fixed bottom-5 right-5 z-50 flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${isOpen ? "border-amber-400/60 bg-slate-800 text-amber-300" : "border-amber-500/40 bg-slate-900 text-amber-300 hover:bg-slate-800"}`}
      >
        {isOpen ? <X className="h-4 w-4" /> : <CircleHelp className="h-4 w-4" />}
        <span>{isOpen ? "Close Guide" : "Presenter Guide"}</span>
      </button>
    </>
  );
}
