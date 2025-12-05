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

export async function fetchLotFullnessPercentages() {
  try {
    const response = await fetch('http://localhost:8000/lots_percent_full');
    const data: string[] = await response.json();
    const lotPercentDict: { [key: number]: string } = {};
    data.forEach((percent, index) => {
      lotPercentDict[index] = percent;
    });
    console.log('Lot Fullness Percentages Dictionary:', lotPercentDict);
    return lotPercentDict;
  } catch (error) {
    console.error('Error fetching lot fullness percentages:', error);
  }
}

export async function randomize_all_lot_events(lot_id: number, all_lots: boolean) {
  try {
    const response = await axios.post(`http://localhost:8000/randomize_all_lot_events/${lot_id}/${all_lots}`);
    console.log('Randomize lot event response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error randomizing lot event:', error);
  }
}