import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  Connection, 
  Edge, 
  Node,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider
} from 'reactflow';
// import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  Settings, 
  Trash2, 
  Play, 
  Save, 
  FolderOpen, 
  Share2, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Activity,
  Zap,
  Lock,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { ComponentNode } from './components/ComponentNode';
import { COMPONENT_TEMPLATES } from './constants';
import { askGemini } from './services/geminiService';
import { cn } from './lib/utils';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const nodeTypes = {
  component: ComponentNode,
};

function SchematicEditor() {
  const [project, setProject] = useState<any>({
    name: 'Advanced_Satellite_BMS',
    sheets: [
      { id: 'sheet-1', name: 'Power_Stage', nodes: [], edges: [] },
      { id: 'sheet-2', name: 'MCU_Control', nodes: [], edges: [] },
      { id: 'sheet-3', name: 'Sensor_Array', nodes: [], edges: [] }
    ],
    activeSheetId: 'sheet-1',
    history: [
      { id: '1', hash: '8f2a1b', author: 'datoxic0', message: 'Initial power stage draft', timestamp: Date.now() - 3600000 },
      { id: '2', hash: '4d5e9f', author: 'datoxic0', message: 'Added filtering caps to VCC', timestamp: Date.now() - 1800000 }
    ]
  });

  const activeSheet = project.sheets.find((s: any) => s.id === project.activeSheetId);
  const [nodes, setNodes, onNodesChange] = useNodesState(activeSheet.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeSheet.edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeView, setActiveView] = useState<'Workspace' | 'Simulation' | 'Versioning' | 'Assets' | 'BOM' | 'Nets'>('Workspace');
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [simData, setSimData] = useState<any[]>([]);

  useEffect(() => {
    if (activeView !== 'Simulation') return;
    
    const interval = setInterval(() => {
      setSimData(prev => {
        const next = [...prev.slice(-49), {
          time: prev.length,
          vcc: 5 + Math.sin(Date.now() * 0.01) * 0.05,
          io1: Math.random() > 0.8 ? 5 : 0,
          io2: Math.sin(Date.now() * 0.005) > 0 ? 5 : 0,
          noise: Math.random() * 0.2
        }];
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeView]);

  // Update project sheets when nodes/edges change
  useEffect(() => {
    setProject((prev: any) => ({
      ...prev,
      sheets: prev.sheets.map((s: any) => 
        s.id === prev.activeSheetId ? { ...s, nodes, edges } : s
      )
    }));
  }, [nodes, edges]);

  const switchSheet = (id: string) => {
    const sheet = project.sheets.find((s: any) => s.id === id);
    setProject(prev => ({ ...prev, activeSheetId: id }));
    setNodes(sheet.nodes);
    setEdges(sheet.edges);
    addLog(`NAVIGATED_TO_SHEET: ${sheet.name}`);
  };

  const createSheet = () => {
    const newSheet = { id: generateId(), name: `New_Sheet_${project.sheets.length + 1}`, nodes: [], edges: [] };
    setProject(prev => ({ ...prev, sheets: [...prev.sheets, newSheet], activeSheetId: newSheet.id }));
    setNodes([]);
    setEdges([]);
    addLog(`CREATED_SHEET: ${newSheet.name}`);
  };

  // Derive categories from templates
  const categories = Array.from(new Set(COMPONENT_TEMPLATES.map(t => t.category)));

  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[SYSTEM] Kernel v4.2.1-STABLE initialized.',
    '[READY] Connected: datoxic0/prototypes'
  ]);

  const addLog = (msg: string) => setConsoleLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
      addLog(`NET_CONNECTED: ${params.source} → ${params.target}`);
    },
    [setEdges, addLog]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const addComponent = (templateId: string) => {
    const template = COMPONENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newNode: Node = {
      id: generateId(),
      type: 'component',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        templateId, 
        label: `${template.name} ${nodes.length + 1}`,
        values: { ...template.defaultValues }
      },
    };
    setNodes((nds) => nds.concat(newNode));
    addLog(`INSTANTIATED: ${template.name}`);
  };

  const deleteSelected = () => {
    if (selectedNode) {
      addLog(`REMOVED: ${selectedNode.data.label}`);
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  };

  const updateNodeData = (field: string, value: string) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          data: {
            ...n.data,
            values: {
              ...n.data.values,
              [field]: value
            }
          }
        };
      }
      return n;
    }));
  };

  const handleAIAnalysis = async () => {
    if (!aiPrompt) return;
    setIsAnalyzing(true);
    addLog(`AI_REQUEST: "${aiPrompt.substring(0, 20)}..."`);
    
    // Simulate real analysis wait
    setTimeout(async () => {
      const result = await askGemini(aiPrompt, { nodes, edges });
      setAiResponse(result || "");
      setIsAnalyzing(false);
      addLog(`AI_RESPONSE: ANALYZE_COMPLETE`);
    }, 500);
  };

  const runDRC = () => {
    addLog("SYSTEM: Running Design Rule Check (DRC)...");
    setIsAnalyzing(true);
    setIsAIOpen(true);
    
    setTimeout(() => {
      let issues: string[] = [];
      const connectedNodeIds = new Set([
        ...edges.map(e => e.source),
        ...edges.map(e => e.target)
      ]);

      // Check for orphan nodes
      nodes.forEach(node => {
        if (!connectedNodeIds.has(node.id)) {
          issues.push(`ORPHANED_NODE: ${node.data.label} (No connections detected)`);
        }
      });

      // Check for VCC to GND shorts
      const vccNodes = nodes.filter(n => n.data.templateId === 'vcc').map(n => n.id);
      const gndNodes = nodes.filter(n => n.data.templateId === 'ground').map(n => n.id);
      
      edges.forEach(edge => {
        if ((vccNodes.includes(edge.source) && gndNodes.includes(edge.target)) ||
            (gndNodes.includes(edge.source) && vccNodes.includes(edge.target))) {
          issues.push(`CRITICAL_FAULT: VCC_GND_SHORT (Potential hardware destruction)`);
        }
      });

      if (issues.length === 0) {
        setAiResponse("### Design Rule Check Result\n\n**STATUS: PASS**\n\nNo critical errors or floating pins detected in the current topology. Design is valid for synchronization.");
        addLog("DRC_STATUS: 0 ERRORS / 0 WARNINGS");
      } else {
        setAiResponse(`### Design Rule Check Result\n\n**STATUS: FAIL (${issues.length} Issues Found)**\n\n${issues.map(i => `- ${i}`).join('\n')}\n\n*Fix the above issues before proceeding to manufacturing.*`);
        addLog(`DRC_STATUS: ${issues.length} ISSUES FOUND`);
      }
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSave = () => {
    addLog(`SAVE_OP: Serializing topology...`);
    setTimeout(() => addLog(`SAVE_COMPLETE: Project state cached`), 500);
  };

  const handleExport = () => {
    addLog(`EXPORT_OP: Generating Gerber/BOM files...`);
    setTimeout(() => addLog(`EXPORT_SUCCESS: schematic_v4_export.zip ready`), 800);
  };

  const handleSim = () => {
    setActiveView('Simulation');
    addLog(`SIM_ENV: Initializing transient analysis...`);
    setTimeout(() => addLog(`SIM_STATUS: STABLE (Convergence reached)`), 1200);
  };

  const handleCommit = () => {
    const message = prompt('Enter commit message:');
    if (!message) return;

    const newCommit = {
      id: generateId(),
      hash: Math.random().toString(16).substring(2, 8),
      author: 'datoxic0',
      message,
      timestamp: Date.now()
    };

    setProject((prev: any) => ({
      ...prev,
      history: [newCommit, ...prev.history]
    }));
    addLog(`COMMIT_SUCCESS: ${newCommit.hash} -> ${message}`);
  };

  const calculateProjectStats = () => {
    const totalNodes = nodes.length;
    const vccNodes = nodes.filter(n => n.data.templateId === 'vcc').length;
    const gndNodes = nodes.filter(n => n.data.templateId === 'ground').length;
    const activeNodes = nodes.filter(n => ['Integrated', 'Active', 'Module'].includes(COMPONENT_TEMPLATES.find(t => t.id === n.data.templateId)?.category || '')).length;
    
    return {
      total: totalNodes,
      vcc: vccNodes,
      gnd: gndNodes,
      active: activeNodes,
      powerEst: (activeNodes * 0.15).toFixed(2) + 'W'
    };
  };

  const stats = calculateProjectStats();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F8FAFC] text-[#1E293B] font-sans overflow-hidden select-none border border-slate-300">
      {/* Header / Navigation Bar */}
      <header className="flex items-center justify-between h-10 px-4 bg-white border-b border-slate-200 z-50 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shadow-sm">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold tracking-tight text-[10px] uppercase">SCHEMATIC_PROX_V4</span>
          </div>
          <nav className="flex space-x-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {(['Workspace', 'Simulation', 'Versioning', 'Assets', 'BOM', 'Nets'] as const).map(view => (
              <span 
                key={view}
                onClick={() => setActiveView(view)}
                className={cn(
                  "py-2.5 cursor-pointer transition-colors border-b-2",
                  activeView === view ? "text-blue-600 border-blue-600" : "border-transparent hover:text-slate-900"
                )}
              >
                {view}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-mono font-bold text-green-700">SYSTEM_SYNC_OK</span>
          </div>
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">JD</div>
            <div className="w-5 h-5 rounded-full border border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">+2</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Component Library */}
        <div 
          style={{ width: isLibraryOpen ? 220 : 0 }}
          className="bg-white border-r border-slate-200 flex flex-col z-40 overflow-hidden shrink-0 transition-all duration-300"
        >
          {/* Project Explorer */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project Explorer</h3>
              <button 
                onClick={createSheet}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                title="New Sheet"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {project.sheets.map((sheet: any) => (
                <div 
                  key={sheet.id}
                  onClick={() => switchSheet(sheet.id)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all border",
                    project.activeSheetId === sheet.id 
                      ? "bg-white border-slate-200 shadow-sm text-blue-600" 
                      : "border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <FolderOpen className="w-3 h-3" />
                  <span className="text-[9px] font-bold truncate">{sheet.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-slate-100 text-[9px] py-1 pl-7 pr-2 rounded border border-transparent focus:border-blue-300 outline-none transition-all"
              />
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-none">
            {categories.map((category) => (
              <section key={category}>
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5">{category}</h3>
                <div className="grid grid-cols-2 gap-1">
                  {COMPONENT_TEMPLATES.filter(t => t.category === category).map(template => (
                    <button
                      key={template.id}
                      onClick={() => addComponent(template.id)}
                      className="p-1.5 border border-slate-100 rounded bg-slate-50/50 hover:border-blue-400 hover:bg-white cursor-pointer flex flex-col items-center transition-all group"
                    >
                      <Plus className="w-2.5 h-2.5 text-slate-300 group-hover:text-blue-500 mb-0.5" />
                      <span className="text-[8px] font-bold text-slate-600 group-hover:text-slate-900 leading-tight text-center truncate w-full">{template.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="p-2 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] font-mono text-slate-400">MEM</span>
              <span className="text-[8px] font-mono font-bold">42.8%</span>
            </div>
            <div className="w-full bg-slate-200 h-0.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[42.8%]" />
            </div>
          </div>
        </div >

        {!isLibraryOpen && (
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 p-0.5 bg-white border border-slate-200 rounded-r-sm hover:bg-slate-50 shadow-sm"
          >
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        )}

        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeView === 'Workspace' ? (
            <main className="flex-1 relative flex flex-col bg-[#EEF2F6]">
              {/* Toolbar Drawer */}
              <div className="absolute top-2 left-2 z-10 flex flex-col bg-white border border-slate-200 rounded shadow-sm p-1 gap-1">
                <button className="p-1.5 bg-blue-50 text-blue-600 rounded" title="Pointer (V)"><ChevronRight className="w-4 h-4 rotate-[-135deg]" /></button>
                <div className="h-px bg-slate-100 mx-1" />
                <button className="p-1.5 hover:bg-slate-50 text-slate-400 rounded" title="Wire (W)"><Plus className="w-4 h-4" /></button>
                <button 
                  onClick={runDRC}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 rounded" 
                  title="Run DRC (D)"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-50 text-slate-400 rounded" title="Label (L)"><MessageSquare className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-slate-50 text-slate-400 rounded" title="Settings (S)"><Settings className="w-4 h-4" /></button>
              </div>

              <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              snapToGrid
              snapGrid={[10, 10]}
            >
              <Background color="#cbd5e1" gap={20} size={1} />
              <Controls className="!m-2 !border-slate-200 !shadow-sm !rounded-sm" />
              
              <Panel position="top-left" className="m-2 flex bg-white/90 backdrop-blur-sm rounded shadow-sm border border-slate-200 p-0.5 space-x-0.5">
                <button title="Open Project" className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600">
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleSave} title="Save Project" className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600">
                  <Save className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] bg-slate-200 my-1 mx-0.5" />
                <button onClick={handleSim} className="px-2 py-0.5 hover:bg-slate-100 rounded text-blue-600 text-[9px] font-bold flex items-center gap-1 transition-colors uppercase">
                  <Play className="w-3 h-3 fill-current" /> Sim
                </button>
                <button onClick={handleExport} className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </Panel>

              <Panel position="top-right" className="m-2">
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded p-2 shadow-sm min-w-[120px]">
                  <h4 className="text-[7px] font-black text-slate-400 uppercase mb-2">Power Analysis</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-slate-500">P_TOTAL:</span>
                      <span className="text-emerald-600 font-bold">{stats.powerEst}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-slate-500">N_COMP:</span>
                      <span className="text-slate-900 font-bold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-slate-500">HEALTH:</span>
                      <span className="text-blue-500 font-bold">OPTIMAL</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </ReactFlow>

            {/* Floating Inspector */}
            {selectedNode && (
                <div 
                  className="absolute right-2 top-2 w-56 bg-white border border-slate-200 rounded shadow-lg z-30 flex flex-col"
                >
                  <div className="p-2 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-[9px] font-bold text-slate-900 uppercase">Inspector</h2>
                      <p className="text-[8px] text-slate-400 font-mono truncate w-32">{selectedNode.data.label}</p>
                    </div>
                    <button 
                      onClick={deleteSelected}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-3 space-y-3">
                     {Object.entries(selectedNode.data.values || {}).map(([key, val]) => (
                       <div key={key} className="space-y-0.5">
                         <label className="text-[8px] font-bold text-slate-500 uppercase block tracking-tighter">{key}</label>
                         <input 
                            type="text" 
                            value={val as string} 
                            onChange={(e) => updateNodeData(key, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded py-0.5 px-1.5 text-[9px] focus:border-blue-500 outline-none transition-all font-mono"
                         />
                       </div>
                     ))}
                  </div>
                </div>
              )}
          </main>
          ) : activeView === 'Simulation' ? (
            <div className="flex-1 flex flex-col bg-[#0F172A] p-4 overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h1 className="text-sm font-black text-white uppercase tracking-tighter">Logic Analyzer [CH1..CH4]</h1>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-500/30 rounded text-[9px] font-bold uppercase transition-colors hover:bg-red-600/30">Halt</button>
                    <button className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-bold uppercase transition-colors hover:bg-blue-600/30">Auto-Scale</button>
                  </div>
               </div>
               
               <div className="flex-1 bg-[#1E293B]/30 border border-slate-700/50 rounded p-4 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                 
                 <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="#475569" fontSize={8} tick={{ fill: '#475569' }} domain={[0, 6]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', fontSize: '8px' }} />
                        <Line type="monotone" dataKey="vcc" stroke="#10B981" strokeWidth={1} dot={false} isAnimationActive={false} />
                        <Line type="stepAfter" dataKey="io1" stroke="#3B82F6" strokeWidth={1} dot={false} isAnimationActive={false} />
                        <Line type="stepAfter" dataKey="io2" stroke="#F59E0B" strokeWidth={1} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               <div className="h-24 mt-4 grid grid-cols-4 gap-4">
                  {[
                    { label: 'V_CORE', val: '1.24V', color: 'text-blue-400' },
                    { label: 'CH1_FREQ', val: '16.0MHz', color: 'text-emerald-400' },
                    { label: 'CH2_DUTY', val: '42.8%', color: 'text-amber-400' },
                    { label: 'IDD_MAX', val: '228mA', color: 'text-rose-400' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-[#1E293B]/50 border border-slate-700/50 rounded p-2 flex flex-col justify-center">
                      <span className="text-[8px] font-bold text-slate-500 uppercase mb-1">{stat.label}</span>
                      <span className={cn("text-lg font-black font-mono", stat.color)}>{stat.val}</span>
                    </div>
                  ))}
               </div>
            </div>
          ) : activeView === 'Versioning' ? (
            <div className="flex-1 overflow-auto bg-white p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                  <div>
                    <h1 className="text-xl font-black uppercase text-slate-900">Commit History</h1>
                    <p className="text-[10px] text-slate-400 font-mono">BRANCH: main (HEAD {"->"} origin/main)</p>
                  </div>
                  <button 
                    onClick={handleCommit}
                    className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    Create Commit
                  </button>
                </div>

                <div className="space-y-6">
                  {project.history.map((commit: any) => (
                    <div key={commit.id} className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-slate-100 last:before:hidden">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-4 hover:border-blue-300 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{commit.message}</h3>
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded uppercase">{commit.hash}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-slate-300" />
                            <span>{commit.author}</span>
                          </div>
                          <span>•</span>
                          <span>{new Date(commit.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeView === 'BOM' ? (
            <div className="flex-1 overflow-auto p-8 bg-white">
              <h1 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Bill of Materials
              </h1>
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 font-black text-slate-400 uppercase tracking-widest">Part</th>
                    <th className="p-3 font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                    <th className="p-3 font-black text-slate-400 uppercase tracking-widest">Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    nodes.reduce((acc, node) => {
                      const name = node.data.label.split(' ')[0];
                      if (!acc[name]) acc[name] = { count: 0, params: node.data.values };
                      acc[name].count++;
                      return acc;
                    }, {} as Record<string, { count: number, params: any }>)
                  ).map(([name, data]) => (
                    <tr key={name} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900 uppercase tracking-tighter">{name}</td>
                      <td className="p-3 font-mono font-black">{data.count}</td>
                      <td className="p-3 font-mono text-slate-400 text-[9px] uppercase tracking-tighter">{JSON.stringify(data.params).replace(/["{}]/g, '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeView === 'Nets' ? (
            <div className="flex-1 overflow-auto p-8 bg-white">
              <h1 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                Netlist Explorer (IPC-D-356)
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {edges.map((edge, i) => (
                  <div key={edge.id} className="p-4 border border-slate-200 rounded bg-[#0F172A] text-slate-400 space-y-2 group hover:border-blue-500 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-blue-400">NET_{i.toString().padStart(4, '0')}</span>
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-[2px] text-[8px] font-bold">IMPEDANCE_MATCHED</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-mono leading-none">
                      <span className="text-white font-bold truncate">{nodes.find(n => n.id === edge.source)?.data.label}</span>
                      <span className="text-slate-700">::</span>
                      <span className="text-white font-bold truncate">{nodes.find(n => n.id === edge.target)?.data.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white grayscale opacity-50 relative overflow-hidden">
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
               <div className="w-16 h-16 border-2 border-slate-300 rounded mb-4 flex items-center justify-center relative">
                  <Settings className="w-8 h-8 text-slate-300 animate-spin-slow" />
                  <Lock className="w-4 h-4 text-slate-400 absolute -bottom-2 -right-2" />
               </div>
               <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 text-center">
                 {activeView} module offline<br />
                 <span className="text-[9px] font-bold lowercase opacity-40">System identity required :: Auth: RO_ADMIN</span>
               </h2>
            </div>
          )}

          {/* Console Area */}
          <div className="h-24 bg-[#0F172A] text-slate-400 font-mono text-[8px] p-2 flex flex-col border-t border-slate-800 shrink-0">
            <div className="flex space-x-3 mb-1.5 border-b border-slate-800 pb-1">
              <span className="text-white border-b border-white px-0.5">Console</span>
              <span className="hover:text-slate-300 cursor-pointer">Logs (12)</span>
              <span className="hover:text-slate-300 cursor-pointer">Build Output</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
              {consoleLogs.map((log, i) => (
                <p key={i} className={cn(
                  log.includes('[SYSTEM]') && "text-blue-400",
                  log.includes('[READY]') && "text-green-400",
                  log.includes('INSTANTIATED') && "text-slate-300",
                  log.includes('REMOVED') && "text-red-400/80",
                  !log.includes('[') && "text-slate-400"
                )}>
                  {log}
                </p>
              ))}
              <p className="opacity-50 text-slate-400">_</p>
            </div>
          </div>
        </div>
      </div>


      {/* AI Assistant Overlay */}
        {isAIOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setIsAIOpen(false)}
          >
            <div 
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Genesis AI Assistant</h2>
                  <p className="text-slate-500 text-xs">Intelligent circuit analysis & design optimization</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {aiResponse && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 text-[10px] leading-relaxed font-mono whitespace-pre-wrap">
                    {aiResponse}
                  </div>
                )}
                
                {!aiResponse && !isAnalyzing && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Check for potential short circuits",
                      "Optimize component placement",
                      "Explain LED voltage calculation",
                      "Check polarity consistency"
                    ].map(hint => (
                      <button 
                        key={hint}
                        onClick={() => setAiPrompt(hint)}
                        className="text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all text-[9px] text-slate-500 font-bold uppercase tracking-tight"
                      >
                        "{hint}"
                      </button>
                    ))}
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-500 text-sm animate-pulse">Analyzing schematic topology...</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIAnalysis()}
                    placeholder="Ask about your schematic..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <button 
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing || !aiPrompt}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white text-[10px] uppercase tracking-wider transition-all"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Bottom Status Bar */}
      <footer className="h-5 bg-white border-t border-slate-200 flex items-center justify-between px-2 text-[8px] font-bold text-slate-400 z-50 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            <span className="text-blue-600 uppercase">SYS_READY</span>
          </div>
          <span className="font-mono">SHEETS: {project.sheets.length}</span>
          <span className="font-mono">NODES: {nodes.length}</span>
          <span className="font-mono text-slate-300">|</span>
          <span className="font-mono">LATENCY: 14ms</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>UTF-8</span>
          <span className="text-slate-500">Master</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
            <span>SYNC_OK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <SchematicEditor />
    </ReactFlowProvider>
  );
}
