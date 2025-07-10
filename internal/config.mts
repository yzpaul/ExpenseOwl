// internal/config.mts
import fs from "fs/promises";
import path from "path";
import { ImportOpt } from "./interfaces/apiInterfaces.mjs";

export class Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: Date;

  constructor(data: Partial<Expense>) {
    this.id = data.id ?? '';
    this.name = data.name ?? '';
    this.category = data.category ?? '';
    this.amount = data.amount ?? 0;
    this.date = data.date ? new Date(data.date) : new Date();
  }

  validate(): string | null {
    if (!this.name.trim()) {
      return 'expense name is required';
    }
    if (!this.category.trim()) {
      return 'category is required';
    }
    // Uncomment if amount must be > 0
    // if (this.amount <= 0) {
    //   return 'amount must be greater than 0';
    // }
    return null;
  }
}

export interface FileConfig {
  importOpt: ImportOpt;
  categories: string[];
  currency: string;
}

const defaultCategories = [
  "Food",
  "Groceries",
  "Travel",
  "Rent",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Miscellaneous",
  "Income",
];

const currencySymbols: Record<string, string> = {
  usd: "$", // US Dollar
  eur: "€", // Euro
  gbp: "£", // British Pound
  jpy: "¥", // Japanese Yen
  cny: "¥", // Chinese Yuan
  krw: "₩", // Korean Won
  inr: "₹", // Indian Rupee
  rub: "₽", // Russian Ruble
  brl: "R$", // Brazilian Real
  zar: "R", // South African Rand
  aed: "AED", // UAE Dirham
  aud: "A$", // Australian Dollar
  cad: "C$", // Canadian Dollar
  chf: "Fr", // Swiss Franc
  hkd: "HK$", // Hong Kong Dollar
  sgd: "S$", // Singapore Dollar
  thb: "฿", // Thai Baht
  try: "₺", // Turkish Lira
  mxn: "Mex$", // Mexican Peso
  php: "₱", // Philippine Peso
  pln: "zł", // Polish Złoty
  sek: "kr", // Swedish Krona
  nzd: "NZ$", // New Zealand Dollar
  dkk: "kr.", // Danish Krone
  idr: "Rp", // Indonesian Rupiah
  ils: "₪", // Israeli New Shekel
  vnd: "₫", // Vietnamese Dong
  myr: "RM", // Malaysian Ringgit
};

export class Config {
  ServerPort = "8080";
  StoragePath: string;
  Categories: string[];
  Currency: string;

  private _writeLock = Promise.resolve();
  importOpt: ImportOpt;

  constructor(dataPath: string) {
    if (dataPath === "data") {
      this.StoragePath = path.join(".", "data");
    } else {
      this.StoragePath = path.resolve(dataPath);
    }
    this.Categories = [...defaultCategories];
    this.Currency = "$";
    this.importOpt = {doBlankCategories:false};
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.StoragePath, { recursive: true });
    } catch (err) {
      console.error("Error creating data directory:", err);
    }
    console.log("Using data directory:", this.StoragePath);

    const configPath = path.join(this.StoragePath, "config.json");

    try {
      const data = await fs.readFile(configPath, "utf8");
      const fileConfig = JSON.parse(data) as FileConfig;

      this.Categories = fileConfig.categories || this.Categories;
      this.Currency = fileConfig.currency || this.Currency;
      this.importOpt = fileConfig.importOpt || this.importOpt;
      console.log("Loaded configuration from file");
    } catch {
      // File doesn't exist or can't parse
      console.log("Configuration file not found, creating default configuration");

      const envCategories = process.env.EXPENSE_CATEGORIES;
      if (envCategories) {
        this.Categories = envCategories.split(",").map((c) => c.trim());
        console.log("Using custom categories from environment variables");
      }

      const envCurrency = process.env.CURRENCY?.toLowerCase();
      if (envCurrency && envCurrency in currencySymbols) {
        this.Currency = currencySymbols[envCurrency];
        console.log("Using custom currency from environment variables");
      }

      const envImportOpt = JSON.parse(process.env.IMPORT_OPT||`{}`);
      if (envImportOpt) {
        if (Object.keys(envImportOpt).length==0) {
          console.log("IMPORT_OPT is not a number, using default");
        } else {
          this.importOpt = envImportOpt;
          console.log("Using IMPORT_OPT date from environment variables",this.importOpt);
        }
      }

      await this.SaveConfig();
    }
  }

  async SaveConfig(): Promise<void> {
    // Queue writes to avoid race conditions
    this._writeLock = this._writeLock.then(async () => {
      const configPath = path.join(this.StoragePath, "config.json");
      const fileConfig: FileConfig = {
        categories: this.Categories,
        currency: this.Currency,
        importOpt: this.importOpt,
      };
      const data = JSON.stringify(fileConfig, null, 4);
      await fs.writeFile(configPath, data, "utf8");
    });
    return this._writeLock;
  }

  async UpdateCategories(categories: string[]): Promise<void> {
    this.Categories = categories;
    await this.SaveConfig();
  }

  async UpdateCurrency(currencyCode: string): Promise<void> {
    const symbol = currencySymbols[currencyCode.toLowerCase()];
    if (!symbol) {
      throw new Error("invalid currency code");
    }
    this.Currency = symbol;
    await this.SaveConfig();
  }

  async UpdateImportOpt(imp: ImportOpt): Promise<void> {
    this.importOpt=imp
    await this.SaveConfig();
  }
}