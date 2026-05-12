import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { COMPONENT_TEMPLATES } from '../constants';
import { cn } from '../lib/utils';
import { Battery, Cpu, Hexagon, Zap, Circle, Minus, Activity, ArrowUp } from 'lucide-react';

const SymbolIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'resistor':
      return <div className="w-12 h-6 border-2 border-neutral-400 flex items-center justify-center bg-neutral-900 rounded-sm">
        <div className="w-full h-px bg-neutral-400" />
      </div>;
    case 'capacitor':
      return <div className="w-12 h-8 flex items-center justify-center gap-1 group">
        <div className="w-px h-6 bg-neutral-400" />
        <div className="w-px h-6 bg-neutral-400" />
      </div>;
    case 'led':
      return <div className="w-10 h-10 flex items-center justify-center relative">
        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        </div>
        <div className="absolute -bottom-1 w-6 h-0.5 bg-red-500 rounded-full" />
      </div>;
    case 'opamp':
      return <div className="w-16 h-16 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 20 L 80 50 L 20 80 Z" fill="none" stroke="currentColor" strokeWidth="4" />
          <text x="35" y="45" className="fill-slate-400 text-[12px] font-bold">+</text>
          <text x="35" y="65" className="fill-slate-400 text-[12px] font-bold">-</text>
        </svg>
      </div>;
    case 'regulator':
      return <div className="w-16 h-12 bg-slate-800 border-2 border-slate-600 rounded flex flex-col items-center justify-center">
        <div className="w-8 h-2 bg-slate-700 mb-1 rounded-sm" />
        <span className="text-[8px] text-white font-mono">REG</span>
      </div>;
    case 'microcontroller':
      return <div className="w-20 h-28 bg-[#1e293b] border-2 border-[#64748b] rounded flex flex-col items-center justify-center p-2 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-4 bg-[#334155] flex items-center justify-center">
          <div className="w-8 h-2 bg-slate-400 rounded-sm opacity-20" />
        </div>
        <div className="text-[10px] text-white font-black tracking-tighter mb-1">ESP32</div>
        <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
        </div>
      </div>;
    case 'battery':
      return <Battery className="w-10 h-6 text-emerald-400 rotate-90" />;
    case 'ic-8':
      return <div className="w-16 h-20 bg-slate-900 border-2 border-slate-700 rounded flex flex-col items-center justify-center relative shadow-inner">
        <div className="absolute top-2 w-4 h-1 bg-slate-800 rounded-full" />
        <span className="text-[8px] text-slate-500 font-mono mt-2">DIP-8</span>
      </div>;
    case 'ic-16':
      return <div className="w-20 h-32 bg-slate-900 border-2 border-slate-700 rounded flex flex-col items-center justify-center relative shadow-inner">
        <div className="absolute top-2 w-6 h-1 bg-slate-800 rounded-full" />
        <span className="text-[8px] text-slate-500 font-mono mt-2">DIP-16</span>
      </div>;
    case 'sensor-dht':
      return <div className="w-14 h-20 bg-blue-500/10 border-2 border-blue-400 rounded flex flex-col items-center p-1 gap-1">
        <div className="grid grid-cols-4 gap-0.5 w-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-full h-2 bg-blue-400/20 rounded-sm" />
          ))}
        </div>
        <Activity className="w-4 h-4 text-blue-400" />
      </div>;
    case 'module-i2c':
      return <div className="w-24 h-16 bg-emerald-900/10 border-2 border-emerald-500 rounded p-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />
        <div className="flex gap-1 mb-1">
           <div className="w-2 h-2 rounded-sm bg-emerald-500/30" />
           <div className="w-4 h-2 rounded-sm bg-emerald-500/30" />
        </div>
        <span className="text-[8px] text-emerald-400 font-black">I2C_MODULE</span>
      </div>;
    case 'mosfet':
      return <div className="w-12 h-12 flex flex-col items-center justify-center relative">
        <div className="absolute left-0 w-4 h-px bg-neutral-400" />
        <div className="w-px h-8 bg-neutral-400" />
        <div className="absolute right-0 top-2 w-4 h-px bg-neutral-400" />
        <div className="absolute right-0 bottom-2 w-4 h-px bg-neutral-400" />
      </div>;
    case 'switch':
      return <div className="w-12 h-6 flex items-center justify-center relative">
        <div className="w-4 h-px bg-neutral-400 absolute left-0" />
        <div className="w-6 h-px bg-neutral-400 rotate-[-30deg] origin-left ml-4" />
        <div className="w-4 h-px bg-neutral-400 absolute right-0" />
      </div>;
    case 'power':
      return <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full border border-neutral-400 mb-1" />
        <div className="text-[8px] font-bold">VCC</div>
      </div>;
    case 'logic-and':
      return <div className="w-12 h-10 border-2 border-neutral-800 rounded-r-2xl bg-neutral-50 flex items-center justify-center text-[8px] font-bold">AND</div>;
    case 'logic-or':
      return <div className="w-12 h-10 border-2 border-neutral-800 rounded-r-3xl bg-neutral-50 flex items-center justify-center text-[8px] font-bold overflow-hidden relative">
        <div className="absolute left-[-4px] w-4 h-full bg-white border-r-2 border-neutral-800 rounded-full" />
        <span className="ml-2">OR</span>
      </div>;
    case 'sensor':
      return <div className="w-10 h-10 bg-blue-100 border-2 border-blue-400 rounded flex items-center justify-center text-[8px] font-bold text-blue-800">TMP</div>;
    case 'ldr':
      return <div className="w-10 h-10 rounded-full border-2 border-orange-400 bg-orange-50 flex items-center justify-center group">
        <div className="w-6 h-px bg-orange-400 rotate-45" />
        <div className="w-6 h-px bg-orange-400 -rotate-45" />
      </div>;
    case 'ground':
      return <div className="flex flex-col items-center">
        <div className="w-6 h-px bg-neutral-400" />
        <div className="w-4 h-px bg-neutral-400 mt-1" />
        <div className="w-2 h-px bg-neutral-400 mt-1" />
      </div>;
    default:
      return <Hexagon className="w-8 h-8 text-neutral-500" />;
  }
};

export const ComponentNode = memo(({ data, selected }: NodeProps) => {
  const template = COMPONENT_TEMPLATES.find(t => t.id === data.templateId);
  if (!template) return null;

  return (
    <div className={cn(
      "relative p-2 rounded-sm bg-white border-2 transition-all group min-w-[60px] min-h-[60px] flex flex-col items-center justify-center",
      selected ? "border-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.2)]" : "border-slate-800 hover:border-slate-600"
    )}>
      <div className="absolute -top-4 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">
        {data.label || template.name}
      </div>
      
      <div className="scale-75">
        <SymbolIcon type={template.symbol} />
      </div>

      {template.pins.map((pin) => (
        <React.Fragment key={pin.id}>
          <Handle
            type="target"
            position={pin.position.x < 0 ? Position.Left : pin.position.x > 0 ? Position.Right : pin.position.y < 0 ? Position.Top : Position.Bottom}
            id={`${pin.id}-target`}
            style={{ 
              left: pin.position.x !== 0 ? (pin.position.x < 0 ? '0%' : '100%') : '50%',
              top: pin.position.y !== 0 ? (pin.position.y < 0 ? '0%' : '100%') : '50%',
              transform: 'translate(-50%, -50%)',
              opacity: selected ? 1 : 0.6,
              zIndex: 1
            }}
            className="hover:scale-150 transition-transform !bg-transparent !border-none"
          />
          <Handle
            type="source"
            position={pin.position.x < 0 ? Position.Left : pin.position.x > 0 ? Position.Right : pin.position.y < 0 ? Position.Top : Position.Bottom}
            id={pin.id}
            style={{ 
              left: pin.position.x !== 0 ? (pin.position.x < 0 ? '0%' : '100%') : '50%',
              top: pin.position.y !== 0 ? (pin.position.y < 0 ? '0%' : '100%') : '50%',
              transform: 'translate(-50%, -50%)',
              opacity: selected ? 1 : 0.6,
              zIndex: 2
            }}
            className="hover:scale-150 transition-transform"
          />
        </React.Fragment>
      ))}

      {data.values && Object.entries(data.values).map(([k, v]) => (
        <div key={k} className="absolute -bottom-4 text-[8px] font-mono font-bold text-blue-600">
          {v}
        </div>
      ))}
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';
