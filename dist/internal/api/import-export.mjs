import { parse as parseCSV } from "csv-parse/sync"; // install csv-parse via npm
// Helper: Parse multipart form to extract file buffer from "file" field
// This is simplified — for production, consider formidable or busboy.
import multiparty from "multiparty";
import { Expense } from "../config.mjs";
export async function ExportCSV(req, res) {
    if (req.method !== "GET") {
        res.statusCode = 405;
        res.end("Method not allowed");
        console.log("HTTP ERROR: Method not allowed");
        return;
    }
    try {
        const expenses = await this.storage.GetAllExpenses();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
        // Write CSV header
        res.write("ID,Name,Category,Amount,Date\n");
        for (const expense of expenses) {
            const line = [
                expense.ID,
                expense.Name.replace(/,/g, ";"), // replace commas in name with semicolon
                expense.Category,
                expense.Amount.toFixed(2),
                expense.Date.toISOString().replace("T", " ").substring(0, 19), // "YYYY-MM-DD HH:mm:ss"
            ].join(",") + "\n";
            res.write(line);
        }
        res.end();
        console.log("HTTP: Exported expenses to CSV");
    }
    catch (err) {
        res.statusCode = 500;
        res.end("Failed to retrieve expenses");
        console.log("HTTP ERROR: Failed to retrieve expenses:", err);
    }
}
export async function ExportJSON(req, res) {
    if (req.method !== "GET") {
        res.statusCode = 405;
        res.end("Method not allowed");
        console.log("HTTP ERROR: Method not allowed");
        return;
    }
    try {
        const expenses = await this.storage.GetAllExpenses();
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", "attachment; filename=expenses.json");
        const jsonData = JSON.stringify(expenses, null, 4);
        res.end(jsonData);
        console.log("HTTP: Exported expenses to JSON");
    }
    catch (err) {
        res.statusCode = 500;
        res.end("Failed to retrieve expenses");
        console.log("HTTP ERROR: Failed to retrieve expenses:", err);
    }
}
// Helper: parse multipart form to get uploaded file buffer (simplified)
async function getFileBuffer(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}
function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
            if (err)
                return reject(err);
            const file = files.file?.[0];
            if (!file)
                return reject(new Error("File not found in form"));
            const fs = require("fs");
            fs.readFile(file.path, (err, data) => {
                if (err)
                    return reject(err);
                resolve({ fileBuffer: data });
            });
        });
    });
}
export async function ImportCSV(req, res) {
    if (req.method !== "POST") {
        res.statusCode = 405;
        res.end("Method not allowed");
        console.log("HTTP ERROR: Method not allowed");
        return;
    }
    try {
        const { fileBuffer } = await parseMultipartForm(req);
        const text = fileBuffer.toString("utf-8");
        const records = parseCSV(text, {
            skip_empty_lines: true,
        });
        if (records.length < 2) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "CSV file has no data rows" }));
            console.log("HTTP ERROR: CSV file is empty or has no data rows");
            return;
        }
        // Header processing
        const header = records[0].map((col) => col.toLowerCase().replace(/[^a-z0-9_\. ]/g, "").trim());
        const nameIdx = header.indexOf("name");
        const categoryIdx = header.indexOf("category");
        const amountIdx = header.indexOf("amount");
        const dateIdx = header.indexOf("date");
        if (nameIdx === -1 || categoryIdx === -1 || amountIdx === -1 || dateIdx === -1) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "CSV missing required columns" }));
            console.log("HTTP ERROR: CSV file missing required columns");
            return;
        }
        const categoryMap = new Map(this.config.Categories.map((cat) => [cat.toLowerCase(), cat]));
        let imported = 0;
        const newCategories = [];
        const skippedDetails = [];
        const dateFormats = [
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd",
            "MM/dd/yyyy",
            "MM/dd/yy",
            "M/d/yyyy",
            "M/d/yy",
            "dd/MM/yyyy",
            "MMM d, yyyy",
            "d MMM yyyy",
            "MMMM d, yyyy",
            "yyyy-MM-dd'T'HH:mm:ss",
        ];
        // Helper to parse date using Date constructor or fallback
        function parseDate(dateStr) {
            let d = new Date(dateStr);
            if (!isNaN(d.getTime()))
                return d;
            // fallback parse with other formats can be added here with date-fns or moment.js
            return null;
        }
        for (let i = 1; i < records.length; i++) {
            const record = records[i];
            if (record.length <= Math.max(nameIdx, categoryIdx, amountIdx, dateIdx)) {
                const msg = `row ${i}: insufficient columns`;
                console.warn(msg);
                skippedDetails.push(msg);
                continue;
            }
            let name = record[nameIdx]?.replace(/[^a-zA-Z0-9_ \.]/g, "").trim() || "-";
            let rawCategory = record[categoryIdx]?.replace(/[^a-zA-Z0-9_ \.]/g, "").trim();
            if (!rawCategory) {
                const msg = `row ${i}: missing category`;
                console.warn(msg);
                skippedDetails.push(msg);
                continue;
            }
            const categoryLower = rawCategory.toLowerCase();
            let category = categoryMap.get(categoryLower) ?? rawCategory;
            if (!categoryMap.has(categoryLower)) {
                categoryMap.set(categoryLower, rawCategory);
                newCategories.push(rawCategory);
            }
            const amountStr = record[amountIdx]?.trim() || "";
            const amount = parseFloat(amountStr);
            if (isNaN(amount)) {
                const msg = `row ${i}: invalid amount '${amountStr}'`;
                console.warn(msg);
                skippedDetails.push(msg);
                continue;
            }
            const dateStr = record[dateIdx]?.trim() || "";
            const date = parseDate(dateStr);
            if (!date) {
                const msg = `row ${i}: invalid date format '${dateStr}'`;
                console.warn(msg);
                skippedDetails.push(msg);
                continue;
            }
            const expense = new Expense({
                id: "",
                name: name,
                category: category,
                amount: amount,
                date: date,
            });
            try {
                await this.storage.SaveExpense(expense);
                imported++;
            }
            catch (err) {
                const msg = `row ${i}: error saving expense: ${err}`;
                console.error(msg);
                skippedDetails.push(msg);
            }
            await new Promise((r) => setTimeout(r, 10));
        }
        if (newCategories.length > 0) {
            const updatedCategories = this.config.Categories.concat(newCategories);
            try {
                await this.config.UpdateCategories(updatedCategories);
            }
            catch (err) {
                console.warn("Warning: Failed to update categories:", err);
            }
        }
        this.writeJSON(res, 200, {
            status: "success",
            imported,
            new_categories: newCategories,
            skipped: skippedDetails.length,
            skipped_details: skippedDetails,
            total_processed: records.length - 1,
        });
        console.log(`HTTP: Imported ${imported} expenses from CSV file`);
    }
    catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Error processing CSV import" }));
        console.log("HTTP ERROR: Error processing CSV import:", err);
    }
}
export async function ImportJSON(req, res) {
    if (req.method !== "POST") {
        res.statusCode = 405;
        res.end("Method not allowed");
        console.log("HTTP ERROR: Method not allowed");
        return;
    }
    try {
        const { fileBuffer } = await parseMultipartForm(req);
        const expensesRaw = JSON.parse(fileBuffer.toString("utf-8"));
        if (!Array.isArray(expensesRaw) || expensesRaw.length === 0) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "JSON file contains no expenses" }));
            console.log("HTTP ERROR: JSON file contains no expenses");
            return;
        }
        const categoryMap = new Map(this.config.Categories.map((cat) => [cat.toLowerCase(), cat]));
        let imported = 0;
        const newCategories = [];
        for (let i = 0; i < expensesRaw.length; i++) {
            const exp = expensesRaw[i];
            exp.name = exp.name ? exp.name.replace(/[^a-zA-Z0-9_ \.]/g, "").trim() : "-";
            if (!exp.category) {
                console.warn(`Warning: Skipping expense ${i + 1} due to missing category`);
                continue;
            }
            exp.category = exp.category.replace(/[^a-zA-Z0-9_ \.]/g, "").trim();
            if (!exp.amount || exp.amount <= 0) {
                console.warn(`Warning: Skipping expense ${i + 1} due to bad amount: ${exp.amount}`);
                continue;
            }
            if (!exp.date) {
                console.warn(`Warning: Skipping expense ${i + 1} due to missing date`);
                continue;
            }
            exp.date = new Date(exp.date);
            const catLower = exp.category.toLowerCase();
            if (categoryMap.has(catLower)) {
                exp.category = categoryMap.get(catLower);
            }
            else {
                categoryMap.set(catLower, exp.category);
                newCategories.push(exp.category);
            }
            exp.id = "";
            try {
                await this.storage.SaveExpense(exp);
                imported++;
            }
            catch (err) {
                console.error(`Error saving expense ${i + 1}: ${err}`);
            }
            await new Promise((r) => setTimeout(r, 10));
        }
        if (newCategories.length > 0) {
            const updatedCategories = this.config.Categories.concat(newCategories);
            try {
                await this.config.UpdateCategories(updatedCategories);
            }
            catch (err) {
                console.warn("Warning: Failed to update categories:", err);
            }
        }
        this.writeJSON(res, 200, {
            status: "success",
            imported,
            new_categories: newCategories,
            skipped: expensesRaw.length - imported,
            total_processed: expensesRaw.length,
        });
        console.log(`HTTP: Imported ${imported} expenses from JSON file`);
    }
    catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Error processing JSON import" }));
        console.log("HTTP ERROR: Error processing JSON import:", err);
    }
}
