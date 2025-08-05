import Papa from 'papaparse';

declare global {
  interface File {
    text(): Promise<string>;
  }
}

export interface CSVRow {
  title: string;
  description?: string;
  dueDate?: string;
  pointsValue?: number;
  durationMinutes?: number;
  passingScore?: number;
  moduleId?: string;
}

export interface CSVResult<T extends Record<string, any>> {
  data: T[];
  headers: string[];
}

export async function parseCSV<T extends Record<string, any>>(file: File): Promise<CSVResult<T>> {
  try {
    const text = await file.text();
    const results = Papa.parse(text, { header: true });
  
    if (results.errors.length > 0) {
      throw new Error('Error parsing CSV: ' + results.errors[0].message);
    }

    return {
      data: results.data as T[],
      headers: results.meta.fields || []
    };
  } catch (error) {
    throw new Error(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
