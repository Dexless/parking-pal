// frontend/src/api/lotApi.ts
import { apiClient } from "./httpClient";
import axios from "axios";

export interface Lot {
  lot_id: number;
  lot_name: string;
  total_capacity: number;
  current: number;
  percent_full: number;
  state: string;
  type: string;
  hours: string;
}


export async function fetchLotData(lot_id: number) {
  try {
    const response = await axios.get(`http://localhost:8000/lots/${lot_id}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
