// frontend/src/ui/data/campusLots.ts
export type LotBlock = {
  id: number;
  name: string; 
  x: number;   
  y: number;   
  w: number;   
  h: number;   
  lngLat?: [number, number];
};
//p_lot_id_dict{0: "P1", 1: "P2", 2: "P3", 3: "P5", 4: "P6", 5: "P9", 6: "P10", 7: "P11", 8: "P13", 9: "P15", 10: "P20", 11: "P27"}
export const LOTS: LotBlock[] = [
  { id: 0,   name: 'P1',   x: 0.5590, y: 0.7047, w: 0.1622, h: 0.0719 },
  { id: 1,   name: 'P2',   x: 0.6590, y: 0.6150, w: 0.0630, h: 0.0890 }, 
  { id: 2,   name: 'P3',   x: 0.7300, y: 0.6500, w: 0.0300, h: 0.1350 }, 
  { id: 3,   name: 'P5',   x: 0.6550, y: 0.4900, w: 0.0700, h: 0.1200 }, 
  { id: 4,   name: 'P6',   x: 0.6550, y: 0.3120, w: 0.0700, h: 0.1700 }, 
  { id: 5,   name: 'P9',   x: 0.8750, y: 0.2200, w: 0.0556, h: 0.0583 }, 
  { id: 7,   name: 'P11',  x: 0.7680, y: 0.1400, w: 0.0800, h: 0.0550 }, 
  { id: 9,   name: 'P15',  x: 0.5250, y: 0.2100, w: 0.0230, h: 0.1320 },
  {
    id: 10,
    name: 'P20',
    x: 0.1770,
    y: 0.0800,
    w: 0.1130,
    h: 0.1150,
    lngLat: [-119.75020300964873, 36.816691633439675],
  },
  //{ id: -1,   name: 'P20B',  x: 0.2800, y: 0.1520, w: 0.0959, h: 0.0383 },
  { id: 11,  name: 'P27',  x: 0.0599, y: 0.6000, w: 0.0700, h: 0.1000 },
];
