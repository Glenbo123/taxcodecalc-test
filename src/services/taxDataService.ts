import { TaxDataRecord } from '../types/TaxDataRecord';

// Simple in-memory storage for tax calculations with LocalStorage persistence
export class TaxDataService {
  private static instance: TaxDataService;
  private records: TaxDataRecord[] = [];
  private readonly STORAGE_KEY = 'uk-tax-calculator-data';
  
  private constructor() {
    this.loadFromStorage();
  }
  
  public static getInstance(): TaxDataService {
    if (!TaxDataService.instance) {
      TaxDataService.instance = new TaxDataService();
    }
    return TaxDataService.instance;
  }
  
  // Load records from localStorage if available
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.records = parsed.map(record => ({
            ...record,
            timestamp: new Date(record.timestamp) // Convert string dates back to Date objects
          }));
        }
      }
    } catch (error) {
      console.error('Error loading tax data from storage:', error);
      this.records = [];
    }
  }
  
  // Save records to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records));
    } catch (error) {
      console.error('Error saving tax data to storage:', error);
    }
  }
  
  // Add a new tax calculation record
  public saveCalculation(record: Omit<TaxDataRecord, 'id' | 'timestamp'>): TaxDataRecord {
    const id = crypto.randomUUID();
    const timestamp = new Date();
    
    const newRecord: TaxDataRecord = {
      id,
      timestamp,
      ...record
    };
    
    this.records.push(newRecord);
    this.saveToStorage();
    
    return newRecord;
  }
  
  // Get all stored tax calculation records
  public getAllCalculations(): TaxDataRecord[] {
    return [...this.records].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // Get a specific tax calculation record by ID
  public getCalculation(id: string): TaxDataRecord | undefined {
    return this.records.find(record => record.id === id);
  }
  
  // Delete a tax calculation record
  public deleteCalculation(id: string): boolean {
    const initialLength = this.records.length;
    this.records = this.records.filter(record => record.id !== id);
    
    if (this.records.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    
    return false;
  }
  
  // Clear all tax calculation records
  public clearAllCalculations(): void {
    this.records = [];
    this.saveToStorage();
  }
}

// Export a singleton instance
export const taxDataService = TaxDataService.getInstance();