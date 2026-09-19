import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { CanvasGraph, CanvasGraphHandle } from '../components/graph/CanvasGraph';
import { RightInspector } from '../components/layout/RightInspector';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { BottomStatusBar } from '../components/layout/BottomStatusBar';
import { ScenarioModal } from '../components/scenarios/ScenarioModal';
import { StressTestDrawer } from '../components/stresstest/StressTestDrawer';
import { ReportModal } from '../components/report/ReportModal';
import { ModelSection } from '../components/model/ModelSection';
import { useDecision } from '../contexts/DecisionContext';
import { useToast } from '../components/ui/Toast';
import { ItemKind, KIND_ORDER, ModelItem } from '../types/decision';
import { loadPrefs, savePrefs } from '../utils/persistence';

export function DecisionModel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    model,
    activeScenarioId,
    historyIndex,
    historyLength,
    activePropagatingIds,
    propagationDeltas,
    updateItem,
    updateNodePosition,
    removeItem,
    addItem,
    selectScenario,
    createScenario,
    applyShock,
    undo,
    redo,
    isDemoModel,
  } = useDecision();

  const graphRef = useRef<CanvasGraphHandle>(null);

  // Interactive UI states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // View & canvas state
  const [zoom, setZoom] = useState(0.85);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<ItemKind | 'all'>('all');
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(() => loadPrefs().showFlowAnimation);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  // Modals / drawers
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [stressTestOpen, setStressTestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Redirect when there is no model at all.
  useEffect(() => {
    if (!model) navigate('/new', { replace: true });
  }, [model, navigate]);

  // Auto-save indicator: localStorage writes are synchronous; flash "saving" on each change.
  useEffect(() => {
    if (!model) return;
    setSaveStatus('saving');
    const t = window.setTimeout(() => setSaveStatus('saved'), 400);
    return () => window.clearTimeout(t);
  }, [model]);

  // Persist the flow-animation preference.
  useEffect(() => {
    savePrefs({ showFlowAnimation });
  }, [showFlowAnimation]);

  // Keyboard shortcuts: undo/redo, fit view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === 'f' && !e.shiftKey) {
        e.preventDefault();
        graphRef.current?.fitView();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  if (!model) return null;

  const items: ModelItem[] = model.items || [];
  const edges = model.edges || [];
  const scenarios = model.scenarios || [];
  const selectedNode = items.find((i) => i.id === selectedNodeId) || null;
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.id || 'decisionos'}-model.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Exported model as JSON', { detail: a.download, tone: 'success' });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-fg select-none">
      {/* 1. COMPACT TOP HEADER */}
      <WorkspaceHeader
        decisionTitle={model.title}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        saveStatus={saveStatus}
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
        onOpenSettings={() => toast('Settings opened', { tone: 'info' })} />

      {/* MAIN CONTENT AREA */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 2. CENTER - GRAPH CANVAS (or list view) */}
        <div className="relative flex-1 h-full w-full overflow-hidden bg-[#090b0e]">
          {isDemoModel && (
            <div className="absolute right-4 top-4 z-20 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-2xs text-amber-400 shadow-xl backdrop-blur-md">
              DEMO MODEL — built-in example, not AI-generated
            </div>
          )}

          <GraphToolbar
            zoom={zoom}
            searchQuery={searchQuery}
            kindFilter={kindFilter}
            showFlowAnimation={showFlowAnimation}
            viewMode={viewMode}
            onZoomIn={() => graphRef.current?.zoomIn()}
            onZoomOut={() => graphRef.current?.zoomOut()}
            onFitView={() => graphRef.current?.fitView()}
            onResetLayout={() => {
              graphRef.current?.resetLayout();
              toast('Canvas layout reset', { tone: 'info' });
            }}
            onSearchChange={setSearchQuery}
            onKindFilterChange={setKindFilter}
            onToggleFlowAnimation={() => setShowFlowAnimation(!showFlowAnimation)}
            onToggleViewMode={() => setViewMode(viewMode === 'canvas' ? 'list' : 'canvas')} />

          {viewMode === 'canvas' ? (
            <CanvasGraph
              ref={graphRef}
              items={items}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              hoveredNodeId={hoveredNodeId}
              hoveredEdgeId={hoveredEdgeId}
              activePropagatingIds={activePropagatingIds}
              propagationDeltas={propagationDeltas}
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
              onViewportChange={setZoom} />
          ) : (
            <div className="h-full w-full overflow-y-auto px-8 py-8">
              <div className="mx-auto max-w-[860px] space-y-10">
                {KIND_ORDER.map((kind) => {
                  const kindItems = items.filter((i) => i.kind === kind);
                  if (kindItems.length === 0) return null;
                  return (
                    <ModelSection
                      key={kind}
                      kind={kind}
                      items={kindItems}
                      totalInKind={kindItems.length}
                      selectedId={selectedNodeId}
                      onSelect={(id) => {
                        setSelectedNodeId(id);
                        setSelectedEdgeId(null);
                      }}
                      onAdd={(k) => addItem(k)}
                      affectsCount={(item) => edges.filter((e) => e.from === item.id).length} />
                  );
                })}
                {items.length === 0 && (
                  <p className="py-16 text-center font-mono text-2xs text-fg-muted">
                    The model has no nodes.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. RIGHT-SIDE INSPECTOR PANEL */}
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
          }} />
      </div>

      {/* 4. LIGHTWEIGHT BOTTOM STATUS BAR */}
      <BottomStatusBar
        items={items}
        edges={edges}
        activeScenarioTitle={activeScenario?.title}
        zoom={zoom}
        selectedNodeLabel={selectedNode?.label}
        onResetView={() => graphRef.current?.resetLayout()} />

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
        }} />

      {/* DYNAMIC STRESS TEST DRAWER */}
      <StressTestDrawer
        open={stressTestOpen}
        items={items}
        edges={edges}
        propagationDeltas={propagationDeltas}
        onClose={() => setStressTestOpen(false)}
        onApplyShock={(id, val) => {
          applyShock(id, val);
          toast('Applied shock to model', { tone: 'warning' });
        }} />

      {/* EXECUTIVE REPORT MODAL */}
      <ReportModal
        open={reportOpen}
        model={model}
        items={items}
        edges={edges}
        onClose={() => setReportOpen(false)}
        onExportJSON={handleExportJSON} />
    </div>
  );
}

export default DecisionModel;
