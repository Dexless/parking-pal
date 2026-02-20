// frontend/src/ui/data/campusLots.ts
export type LotBlock = {
  id: number;
  name: string;
};
//lot_dict{0: "P1", 1: "P2", 2: "P3", 3: "P5", 4: "P6", 5: "P9", 6: "P10", 7: "P11", 8: "P13", 9: "P15", 10: "P20", 11: "P27"}
export const LOTS: LotBlock[] = [
  { id: 0, name: 'P1' },
  { id: 1, name: 'P2' },
  { id: 2, name: 'P3' },
  { id: 3, name: 'P5' },
  { id: 4, name: 'P6' },
  { id: 5, name: 'P9' },
  { id: 6, name: 'P10' },
  { id: 7, name: 'P11' },
  { id: 8, name: 'P13' },
  { id: 9, name: 'P15' },
  { id: 10, name: 'P20' },
  { id: 11, name: 'P27' },
];
