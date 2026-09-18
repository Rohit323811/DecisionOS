import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // View & Canvas State
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 120, y: 80 });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<ItemKind | 'all'>('all');
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

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
      {/* 1. COMPACT TOP HEADER */}
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

      {/* MAIN CONTENT AREA */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 2. CENTER - GRAPH CANVAS */}
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
          }}
        />
      </div>

      {/* 4. LIGHTWEIGHT BOTTOM STATUS BAR */}
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
      />

      {/* EXECUTIVE REPORT MODAL */}
      <ReportModal
        open={reportOpen}
        title={model.title}
        prompt={model.prompt}
        summary={model.summary}
        items={items}
        edges={edges}
        onClose={() => setReportOpen(false)}
        onExportJSON={() => {
          toast('Exported model as JSON', { detail: `${model.id}-decisionos.json`, tone: 'success' });
        }}
      />
    </div>
  );
}
