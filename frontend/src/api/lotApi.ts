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

// Fetch lot data by lot ID
export async function fetchLotData(lot_id: number) {
  try {
    const response = await axios.get(`http://localhost:8000/lots/${lot_id}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Randomize lot data in case values are not populated and error occurs
export async function randomizeData(lot_id: number) {
  try {
    const response = await axios.get(`http://localhost:8000/randomize_lot/${lot_id}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}