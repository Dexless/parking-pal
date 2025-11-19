// frontend/src/ui/data/campusLots.ts
export type LotBlock = {
  id: string;
  name: string; 
  x: number;   
  y: number;   
  w: number;   
  h: number;   
};

export const LOTS: LotBlock[] = [
  { id: 'P1',   name: 'P1',   x: 0.5590, y: 0.6917, w: 0.1389, h: 0.0900 },
  { id: 'P2',   name: 'P2',   x: 0.6590, y: 0.6200, w: 0.0630, h: 0.1550 }, 
  { id: 'P3',   name: 'P3',   x: 0.7300, y: 0.6500, w: 0.0300, h: 0.1350 }, 
  { id: 'P5',   name: 'P5',   x: 0.6550, y: 0.4900, w: 0.0700, h: 0.1200 }, 
  { id: 'P6',   name: 'P6',   x: 0.6550, y: 0.3120, w: 0.0700, h: 0.1700 }, 
  { id: 'P9',   name: 'P9',   x: 0.8750, y: 0.2200, w: 0.0556, h: 0.0583 }, 
  { id: 'P11',  name: 'P11',  x: 0.7680, y: 0.1300, w: 0.0800, h: 0.0650 }, 
  { id: 'P15',  name: 'P15',  x: 0.5200, y: 0.2000, w: 0.0300, h: 0.1420 },
  { id: 'P20',  name: 'P20',  x: 0.1770, y: 0.0800, w: 0.1130, h: 0.1150 },
  { id: 'P20B', name: 'P20',  x: 0.2800, y: 0.1520, w: 0.0959, h: 0.0383 },
  { id: 'P27',  name: 'P27',  x: 0.0599, y: 0.6000, w: 0.0700, h: 0.1000 },
];
