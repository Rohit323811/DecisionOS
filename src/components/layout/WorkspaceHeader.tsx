import { useState } from 'react';
import {
  ActivityIcon,
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  LayersIcon,
  PlusIcon,
  Redo2Icon,
  SettingsIcon,
  ShieldAlertIcon,
  Undo2Icon,
  UserIcon
} from 'lucide-react';
import { Wordmark } from './TopBar';
import { Scenario } from '../../types/decision';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';

interface WorkspaceHeaderProps {
  decisionTitle: string;
  scenarios: Scenario[];
  activeScenarioId: string;
  saveStatus?: 'saved' | 'unsaved' | 'saving';
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectScenario: (id: string) => void;
  onCreateScenario?: () => void;
  onOpenStressTest: () => void;
  onOpenReport: () => void;
  onOpenSettings?: () => void;
  onSelectDecision?: (decisionId: string) => void;
}

export function WorkspaceHeader({
  decisionTitle,
  scenarios,
  activeScenarioId,
  saveStatus = 'saved',
  canUndo = true,
  canRedo = false,
  onUndo,
  onRedo,
  onSelectScenario,
  onCreateScenario,
  onOpenStressTest,
  onOpenReport,
  onOpenSettings
}: WorkspaceHeaderProps) {
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-line bg-bg/95 px-4 backdrop-blur-md select-none">
      {/* Left section: Logo + Decision Title + Save status */}
      <div className="flex items-center gap-4 min-w-0">
        <Wordmark />

        <div className="h-4 w-px bg-line" />

        <div className="flex items-center gap-2.5 min-w-0">
          <span className="truncate text-[13.5px] font-semibold text-fg max-w-[280px]">
            {decisionTitle}
          </span>

          {/* Save Status Badge */}
          <span className="inline-flex items-center gap-1.5 font-mono text-2xs text-fg-muted px-2 py-0.5 rounded bg-surface border border-line">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                saveStatus === 'saved' && 'bg-emerald-400',
                saveStatus === 'saving' && 'bg-amber-400 animate-ping',
                saveStatus === 'unsaved' && 'bg-amber-500'
              )}
            />
            {saveStatus === 'saved' ? 'Auto-saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>
      </div>

      {/* Middle section: Undo/Redo + Scenario Selector */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo controls */}
        <div className="flex items-center gap-1 rounded-md border border-line bg-surface/80 p-0.5">
          <Tooltip content="Undo change (Cmd+Z)">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded text-fg-secondary hover:bg-line/50 hover:text-fg transition-colors disabled:opacity-30 disabled:pointer-events-none'
              )}
              aria-label="Undo"
            >
              <Undo2Icon className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Redo change (Cmd+Shift+Z)">
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded text-fg-secondary hover:bg-line/50 hover:text-fg transition-colors disabled:opacity-30 disabled:pointer-events-none'
              )}
              aria-label="Redo"
            >
              <Redo2Icon className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>

        <div className="h-4 w-px bg-line" />

        {/* Scenario Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
            className="flex h-8 items-center gap-2 rounded-md border border-accent/40 bg-[#102220] px-3 font-mono text-2xs font-medium text-accent hover:border-accent hover:bg-[#122826] transition-colors"
          >
            <LayersIcon className="h-3.5 w-3.5" />
            <span className="truncate max-w-[140px]">
              {activeScenario ? activeScenario.title : 'Scenario'}
            </span>
            <ChevronDownIcon className="h-3 w-3 opacity-70" />
          </button>

          {scenarioDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-2xl z-50"
              onMouseLeave={() => setScenarioDropdownOpen(false)}
            >
              <div className="px-2 py-1.5 font-mono text-2xs uppercase tracking-wider text-fg-muted border-b border-line mb-1">
                Active Scenario
              </div>
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectScenario(s.id);
                    setScenarioDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                    s.id === activeScenarioId
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-fg-secondary hover:bg-[#15191f] hover:text-fg'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.title}</p>
                    {s.description && <p className="truncate text-2xs text-fg-muted mt-0.5">{s.description}</p>}
                  </div>
                  {s.id === activeScenarioId && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent ml-2" />}
                </button>
              ))}

              {onCreateScenario && (
                <button
                  onClick={() => {
                    onCreateScenario();
                    setScenarioDropdownOpen(false);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-line px-2.5 py-1.5 text-2xs font-mono text-accent hover:bg-accent/5 transition-colors"
                >
                  <PlusIcon className="h-3 w-3" /> New scenario...
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Stress Test + Report + Profile/Settings */}
      <div className="flex items-center gap-2">
        {/* Stress Test Button */}
        <button
          onClick={onOpenStressTest}
          className="flex h-8 items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 text-2xs font-mono font-medium text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/20 transition-colors"
        >
          <ShieldAlertIcon className="h-3.5 w-3.5" />
          <span>Stress Test</span>
        </button>

        {/* Executive Report Button */}
        <button
          onClick={onOpenReport}
          className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-3 text-2xs font-mono font-medium text-fg-secondary hover:border-line-strong hover:text-fg transition-colors"
        >
          <FileTextIcon className="h-3.5 w-3.5" />
          <span>Report</span>
        </button>

        <div className="h-4 w-px bg-line mx-1" />

        {/* Profile / Settings */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-[#161a20] text-fg-secondary hover:border-accent hover:text-fg transition-colors"
            aria-label="User settings"
          >
            <UserIcon className="h-4 w-4" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border border-line bg-surface p-1 shadow-2xl z-50"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-line">
                <p className="text-[13px] font-semibold text-fg">Lead Modeler</p>
                <p className="text-2xs text-fg-muted font-mono">modeler@decisionos.ai</p>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-fg-secondary hover:bg-line/50 hover:text-fg transition-colors"
              >
                <SettingsIcon className="h-3.5 w-3.5" /> Settings
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenReport();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-fg-secondary hover:bg-line/50 hover:text-fg transition-colors"
              >
                <ActivityIcon className="h-3.5 w-3.5" /> Model Telemetry
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
