import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GridIcon,
  ListIcon
} from 'lucide-react';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { CanvasGraph } from '../components/graph/CanvasGraph';
import { RightInspector } from '../components/layout/RightInspector';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { BottomStatusBar } from '../components/layout/BottomStatusBar';
import { ScenarioModal } from '../components/scenarios/ScenarioModal';
import { StressTestDrawer } from '../components/stresstest/StressTestDrawer';
import { ReportModal } from '../components/report/ReportModal';
import { useDecision } from '../contexts/DecisionContext';
import { useToast } from '../components/ui/Toast';
import { ItemKind } from '../types/decision';
import { KIND_META } from '../utils/kindMeta';
import { Badge } from '../components/ui/Badge';
import { cn } from '../utils/cn';

export function DecisionModel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    model,
    activeScenarioId,
    historyIndex,
    historyLength,
    activePropagatingIds,
    updateItem,
    updateNodePosition,
    removeItem,
    selectScenario,
    createScenario,
    applyShock,
    undo,
    redo
  } = useDecision();

  // Navigation redirect if model absent
  useEffect(() => {
    if (!model) navigate('/new', { replace: true });
  }, [model, navigate]);

  // Interactive UI States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Canvas & View State
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 120, y: 80 });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<ItemKind | 'all'>('all');
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);

  // View Mode: 'canvas' for Desktop graph canvas, 'list' for Mobile/Tablet responsive list
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [mobileTab, setMobileTab] = useState<'overview' | 'nodes' | 'scenarios' | 'report'>('overview');

  // Modals / Drawers State
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [stressTestOpen, setStressTestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!model) return null;

  const items = model.items || [];
  const edges = model.edges || [];
  const scenarios = model.scenarios || [];

  const selectedNode = items.find((i) => i.id === selectedNodeId) || null;
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.1).toFixed(2)), 2.0));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.1).toFixed(2)), 0.4));
  const handleFitView = () => {
    setZoom(0.85);
    setPan({ x: 80, y: 60 });
    toast('View fitted to workspace canvas', { tone: 'info' });
  };
  const handleResetLayout = () => {
    setZoom(0.9);
    setPan({ x: 120, y: 80 });
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    toast('Canvas layout reset', { tone: 'info' });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-fg select-none">
      {/* 1. TOP NAVIGATION HEADER */}
      <WorkspaceHeader
        decisionTitle={model.title}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        saveStatus="saved"
        canUndo={historyIndex > 0}
        canRedo={historyIndex < historyLength - 1}
        onUndo={undo}
        onRedo={redo}
        onSelectScenario={(id) => {
          selectScenario(id);
          toast(`Switched scenario to "${scenarios.find((s) => s.id === id)?.title}"`, { tone: 'success' });
        }}
        onCreateScenario={() => setScenarioModalOpen(true)}
        onOpenStressTest={() => setStressTestOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onOpenSettings={() => toast('Settings opened', { tone: 'info' })}
      />

      {/* MOBILE / TABLET VIEW SWITCHER BAR */}
      <div className="flex md:hidden items-center border-b border-line bg-surface px-4 py-2 font-mono text-2xs overflow-x-auto gap-2 shrink-0">
        <button
          onClick={() => setViewMode('canvas')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded border',
            viewMode === 'canvas' ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-line text-fg-muted'
          )}
        >
          <GridIcon className="h-3 w-3" /> Graph Canvas
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded border',
            viewMode === 'list' ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-line text-fg-muted'
          )}
        >
          <ListIcon className="h-3 w-3" /> Mobile Overview
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* DESKTOP CANVAS / RESPONSIVE VIEW */}
        {viewMode === 'canvas' ? (
          <div className="relative flex-1 h-full w-full overflow-hidden bg-[#090b0e]">
            {/* Floating Graph Toolbar */}
            <GraphToolbar
              zoom={zoom}
              searchQuery={searchQuery}
              kindFilter={kindFilter}
              showFlowAnimation={showFlowAnimation}
              viewMode={viewMode}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitView={handleFitView}
              onResetLayout={handleResetLayout}
              onSearchChange={setSearchQuery}
              onKindFilterChange={setKindFilter}
              onToggleFlowAnimation={() => setShowFlowAnimation(!showFlowAnimation)}
              onToggleViewMode={() => setViewMode(viewMode === 'canvas' ? 'list' : 'canvas')}
            />

            {/* Canvas Component */}
            <CanvasGraph
              items={items}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              hoveredNodeId={hoveredNodeId}
              hoveredEdgeId={hoveredEdgeId}
              activePropagatingIds={activePropagatingIds}
              zoom={zoom}
              pan={pan}
              searchQuery={searchQuery}
              kindFilter={kindFilter}
              showFlowAnimation={showFlowAnimation}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                if (id) setSelectedEdgeId(null);
              }}
              onSelectEdge={(id) => {
                setSelectedEdgeId(id);
                if (id) setSelectedNodeId(null);
              }}
              onHoverNode={setHoveredNodeId}
              onHoverEdge={setHoveredEdgeId}
              onNodeMove={updateNodePosition}
              onPanChange={setPan}
              onZoomChange={setZoom}
            />
          </div>
        ) : (
          /* RESPONSIVE MOBILE/TABLET LIST VIEW (Model Overview, Node List, Details, Dependencies, Scenarios, Report) */
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-bg font-sans max-w-4xl mx-auto w-full">
            {/* Mobile Tab Navigation */}
            <div className="flex items-center justify-around border-b border-line pb-2 font-mono text-2xs">
              <button
                onClick={() => setMobileTab('overview')}
                className={cn('py-1.5 px-3 border-b-2 font-semibold', mobileTab === 'overview' ? 'border-accent text-accent' : 'border-transparent text-fg-muted')}
              >
                Overview
              </button>
              <button
                onClick={() => setMobileTab('nodes')}
                className={cn('py-1.5 px-3 border-b-2 font-semibold', mobileTab === 'nodes' ? 'border-accent text-accent' : 'border-transparent text-fg-muted')}
              >
                Node Inventory ({items.length})
              </button>
              <button
                onClick={() => setMobileTab('scenarios')}
                className={cn('py-1.5 px-3 border-b-2 font-semibold', mobileTab === 'scenarios' ? 'border-accent text-accent' : 'border-transparent text-fg-muted')}
              >
                Scenarios ({scenarios.length})
              </button>
              <button
                onClick={() => setMobileTab('report')}
                className={cn('py-1.5 px-3 border-b-2 font-semibold', mobileTab === 'report' ? 'border-accent text-accent' : 'border-transparent text-fg-muted')}
              >
                Report
              </button>
            </div>

            {mobileTab === 'overview' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
                  <h2 className="text-lg font-bold text-fg">{model.title}</h2>
                  <p className="text-2xs text-fg-muted border-l-2 border-accent pl-2.5">“{model.prompt}”</p>
                  <p className="text-[13.5px] leading-relaxed text-fg-secondary pt-1">{model.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center font-mono text-2xs">
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <span className="block text-xl font-bold text-fg">{items.length}</span>
                    <span className="text-fg-muted">Nodes</span>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <span className="block text-xl font-bold text-accent">{edges.length}</span>
                    <span className="text-fg-muted">Relationships</span>
                  </div>
                </div>
              </div>
            )}

            {mobileTab === 'nodes' && (
              <div className="space-y-3">
                <span className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold block">
                  Model Nodes & Details
                </span>
                <div className="space-y-2">
                  {items.map((item) => {
                    const meta = KIND_META[item.kind] || KIND_META.variable;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedNodeId(item.id);
                          setViewMode('canvas');
                        }}
                        className="rounded-xl border border-line bg-surface p-3.5 space-y-2 cursor-pointer hover:border-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-mono text-2xs uppercase text-fg-muted font-semibold">
                            <Icon className={cn('h-3.5 w-3.5', meta.color)} /> {item.kind}
                          </span>
                          <Badge tone={meta.tone} mono>
                            {item.range ? `${item.range.value} ${item.range.unit}` : String(item.value ?? item.origin)}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-[13.5px] text-fg">{item.label}</h4>
                        <p className="text-2xs text-fg-muted">{item.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mobileTab === 'scenarios' && (
              <div className="space-y-3">
                <span className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold block">
                  Active Scenario: {activeScenario?.title}
                </span>
                <div className="space-y-2">
                  {scenarios.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        selectScenario(sc.id);
                        toast(`Activated "${sc.title}"`, { tone: 'success' });
                      }}
                      className={cn(
                        'w-full text-left rounded-xl border p-3.5 space-y-1 transition-colors',
                        sc.id === activeScenarioId ? 'border-accent bg-[#102422]' : 'border-line bg-surface'
                      )}
                    >
                      <h4 className="font-semibold text-fg text-[13.5px]">{sc.title}</h4>
                      <p className="text-2xs text-fg-muted">{sc.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mobileTab === 'report' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
                  <h3 className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
                    Decision Executive Summary
                  </h3>
                  <p className="text-2xs leading-relaxed text-fg-secondary">{model.summary}</p>
                </div>
                <button
                  onClick={() => setReportOpen(true)}
                  className="w-full rounded-lg bg-accent py-2.5 font-mono text-2xs font-semibold text-black hover:bg-accent/90"
                >
                  Open Full Analytical Report Modal
                </button>
              </div>
            )}
          </div>
        )}

        {/* RIGHT-SIDE INSPECTOR PANEL (Desktop & Tablet) */}
        <div className="hidden md:block">
          <RightInspector
            items={items}
            edges={edges}
            modelSummary={model.summary}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id) setSelectedEdgeId(null);
            }}
            onUpdateItem={updateItem}
            onDeleteItem={(id) => {
              removeItem(id);
              setSelectedNodeId(null);
              toast('Node removed from graph', { tone: 'warning' });
            }}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          />
        </div>
      </div>

      {/* LIGHTWEIGHT BOTTOM STATUS BAR */}
      <BottomStatusBar
        items={items}
        edges={edges}
        activeScenarioTitle={activeScenario?.title}
        zoom={zoom}
        selectedNodeLabel={selectedNode?.label}
        onResetView={handleResetLayout}
      />

      {/* SCENARIO SYSTEM MODAL */}
      <ScenarioModal
        open={scenarioModalOpen}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        items={items}
        onClose={() => setScenarioModalOpen(false)}
        onSelectScenario={(id) => {
          selectScenario(id);
          toast(`Activated scenario "${scenarios.find((s) => s.id === id)?.title}"`, { tone: 'success' });
        }}
        onCreateScenario={(t, d) => {
          createScenario(t, d);
          toast(`Created new scenario "${t}"`, { tone: 'success' });
        }}
      />

      {/* DYNAMIC STRESS TEST DRAWER */}
      <StressTestDrawer
        open={stressTestOpen}
        items={items}
        edges={edges}
        onClose={() => setStressTestOpen(false)}
        onApplyShock={(id, val) => {
          applyShock(id, val);
          toast('Applied shock to model', { tone: 'warning' });
        }}
        onApplyToScenario={(title) => {
          createScenario(title, 'Scenario created from stress test parameters');
          toast(`Created stress scenario "${title}"`, { tone: 'success' });
        }}
      />

      {/* EXECUTIVE REPORT MODAL */}
      <ReportModal
        open={reportOpen}
        title={model.title}
        prompt={model.prompt}
        summary={model.summary}
        items={items}
        edges={edges}
        scenarios={scenarios}
        activeScenarioTitle={activeScenario?.title}
        onClose={() => setReportOpen(false)}
        onEditModel={() => {
          setReportOpen(false);
          toast('Model ready for editing in workspace', { tone: 'info' });
        }}
        onCompareScenarios={() => {
          setReportOpen(false);
          setScenarioModalOpen(true);
        }}
        onRunStressTest={() => {
          setReportOpen(false);
          setStressTestOpen(true);
        }}
        onExportJSON={() => {
          toast('Exported model as JSON', { detail: `${model.id}-decisionos.json`, tone: 'success' });
        }}
        onSaveDecision={() => {
          toast('Decision saved successfully', { tone: 'success' });
        }}
      />
    </div>
  );
}
