import { Injectable } from '@angular/core';
import * as xlsx from 'xlsx';

const headers = [
  'Timestamp',
  'EGMF',
  'Engine Speed/RPM',
  'air_filter_delta',
  'cellular_signal',
  'engine_torque',
  'fuel_flow_rate',
  'air_load_percent',
  'air_rul_hours',
  'Engine Percent Torque/Load',
];

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor() {}

  getData = async (file: File) => {
    const workbook = xlsx.read(await file.arrayBuffer(), { cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const range = this.getWorksheetRange(worksheet);

    const toReturn: string[][] = [];
    const sortedHeaders = this.getSortedWorksheetHeaders(headers, worksheet);

    for (let header = 0; header < sortedHeaders.length; header++) {
      toReturn.push([]);

      for (let i = 2; i <= range.rows; i++) {
        const cell = this.getSafeValueFromCell(
          [this.columnToLetter(header + 1), i],
          worksheet
        );
        toReturn[header].push(cell);
      }
    }

    return {
      timestamps: toReturn[0],
      egmf: toReturn[1],
      engineSpeedRPM: toReturn[2],
      airFilterDelta: toReturn[3],
      cellularSignal: toReturn[4],
      engineTorque: toReturn[5],
      fuelFlowRate: toReturn[6],
      airLoadPercent: toReturn[7],
      airRuleHours: toReturn[7],
      enginePercentTorque: toReturn[7],
    };
  };
  getAvailableHeaders = async (file: File): Promise<string[]> => {
    const arrBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = this.getWorksheetRange(worksheet);
    if (!range.rows) {
      return [];
    }
    const headers: string[] = [];
    for (let i = 1; i <= range.cols; i++) {
      const value = this.getSafeValueFromCell(
        [this.columnToLetter(i), 1],
        worksheet
      );
      headers.push(value);
    }
    return headers;
  };

  getWorksheetRange = (worksheet: xlsx.WorkSheet): worksheetRange => {
    if (worksheet['!ref']) {
      const parts = xlsx.utils.decode_range(worksheet['!ref']);
      const numCols = parts.e.c - parts.s.c + 1;
      const numRows = parts.e.r - parts.s.r + 1;
      return { rows: numRows, cols: numCols };
    }
    return { rows: 0, cols: 0 };
  };

  columnToLetter = (column: number): string => {
    let temp,
      letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;
  };

  getSortedWorksheetHeaders = (
    headers: string[],
    worksheet: xlsx.WorkSheet
  ): string[] => {
    const indices: string[] = [];
    const range = this.getWorksheetRange(worksheet);

    for (let j = 1; j <= range.cols; j++) {
      const header = this.getSafeValueFromCell(
        [this.columnToLetter(j), 1],
        worksheet
      );
      if (headers.includes(header)) {
        indices[headers.indexOf(header)] = this.columnToLetter(j);
      }
    }

    if (indices.filter((x) => x).length !== headers.length) {
      console.log(indices);
      console.log(headers);
      throw new Error("Some headers aren't found!");
    }

    return indices;
  };

  getSafeValueFromCell = (
    cell: [string, number],
    worksheet: xlsx.WorkSheet
  ): string => {
    return worksheet[`${cell[0]}${cell[1]}`]?.v
      ? worksheet[`${cell[0]}${cell[1]}`].v.toString()
      : '';
  };
}

export interface IPersonFromFile {
  firstName: string;
  lastName: string;
  website: string;
}

export interface worksheetRange {
  rows: number;
  cols: number;
}
