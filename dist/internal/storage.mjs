// internal/storage.mts
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
export class ErrExpenseNotFound extends Error {
}
export class ErrInvalidExpense extends Error {
}
// Simple async mutex for file operations
class Mutex {
    _queue = Promise.resolve(); // Accepts any result type
    lock(fn) {
        const run = async () => fn();
        const result = this._queue.then(run, run); // This returns Promise<T>
        this._queue = result.catch(() => { }); // Prevent rejection from breaking the chain
        return result;
    }
}
export class JsonStore {
    filePath;
    mutex = new Mutex();
    constructor(filePath) {
        this.filePath = filePath;
    }
    static async new(filePath) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        try {
            await fs.access(filePath);
        }
        catch {
            // file does not exist, create initial file
            const initialData = { expenses: [] };
            await fs.writeFile(filePath, JSON.stringify(initialData, null, 4), "utf8");
            console.log("Created expense storage file");
        }
        return new JsonStore(filePath);
    }
    async saveExpense(expense) {
        await this.mutex.lock(async () => {
            const data = await this.readFile();
            if (!expense.id) {
                expense.id = uuidv4();
            }
            if (!expense.date || isNaN(expense.date.getTime())) {
                expense.date = new Date();
            }
            data.expenses.push(expense);
            console.log(`Added expense with id ${expense.id}`);
            await this.writeFile(data);
        });
    }
    async deleteExpense(id) {
        await this.mutex.lock(async () => {
            const data = await this.readFile();
            const originalLen = data.expenses.length;
            data.expenses = data.expenses.filter((e) => e.id !== id);
            if (data.expenses.length === originalLen) {
                throw new ErrExpenseNotFound(`Expense with ID ${id} not found`);
            }
            console.log(`Deleted expense with ID ${id}`);
            await this.writeFile(data);
        });
    }
    async editExpense(expense) {
        await this.mutex.lock(async () => {
            const data = await this.readFile();
            const idx = data.expenses.findIndex((e) => e.id === expense.id);
            if (idx === -1) {
                throw new ErrExpenseNotFound(`Expense with id ${expense.id} not found`);
            }
            // Preserve original date if zero/invalid?
            if (!expense.date || isNaN(expense.date.getTime())) {
                expense.date = data.expenses[idx].date;
            }
            data.expenses[idx] = expense;
            console.log(`Edited expense with id ${expense.id}`);
            await this.writeFile(data);
        });
    }
    async getAllExpenses() {
        // readFile is async but no need to lock read because we do locking on write
        const data = await this.readFile();
        console.log("Retrieved all expenses");
        return data.expenses;
    }
    async readFile() {
        const content = await fs.readFile(this.filePath, "utf8");
        return JSON.parse(content);
    }
    async writeFile(data) {
        const content = JSON.stringify(data, null, 4);
        await fs.writeFile(this.filePath, content, "utf8");
    }
}
