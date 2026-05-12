export type ComponentCategory = 'Passive' | 'Active' | 'Integrated' | 'Connector' | 'Power' | 'Logic' | 'Sensor' | 'Module' | 'Other';

export interface ComponentTemplate {
  id: string;
  name: string;
  category: ComponentCategory;
  symbol: string;
  pins: PinTemplate[];
  defaultValues: Record<string, string>;
  specs?: Record<string, string>;
}

export interface PinTemplate {
  id: string;
  name: string;
  position: { x: number; y: number };
}

export interface SchematicComponent {
  id: string;
  templateId: string;
  x: number;
  y: number;
  rotation: number;
  values: Record<string, string>;
  label: string;
}

export interface Wire {
  id: string;
  sourceId: string;
  sourcePinId: string;
  targetId: string;
  targetPinId: string;
}

export interface Sheet {
  id: string;
  name: string;
  components: any[]; // Nodes for ReactFlow
  wires: any[];      // Edges for ReactFlow
  lastModified: number;
}

export interface Commit {
  id: string;
  hash: string;
  author: string;
  message: string;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  sheets: Sheet[];
  activeSheetId: string;
  history: Commit[];
}
