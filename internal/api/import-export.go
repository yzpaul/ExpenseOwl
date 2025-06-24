package api

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/tanq16/expenseowl/internal/config"
)

func (h *Handler) ExportCSV(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		log.Println("HTTP ERROR: Method not allowed")
		return
	}
	expenses, err := h.storage.GetAllExpenses()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve expenses"})
		log.Printf("HTTP ERROR: Failed to retrieve expenses: %v\n", err)
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=expenses.csv")
	// write CSV data
	w.Write([]byte("ID,Name,Category,Amount,Date\n"))
	for _, expense := range expenses {
		line := fmt.Sprintf("%s,%s,%s,%.2f,%s\n",
			expense.ID,
			strings.ReplaceAll(expense.Name, ",", ";"), // Replace , in name with ;
			expense.Category,
			expense.Amount,
			expense.Date.Format("2006-01-02 15:04:05"),
		)
		w.Write([]byte(line))
	}
	log.Println("HTTP: Exported expenses to CSV")
}

func (h *Handler) ExportJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		log.Println("HTTP ERROR: Method not allowed")
		return
	}
	expenses, err := h.storage.GetAllExpenses()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve expenses"})
		log.Printf("HTTP ERROR: Failed to retrieve expenses: %v\n", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=expenses.json")
	// Pretty print the JSON data for better readability
	jsonData, err := json.MarshalIndent(expenses, "", "    ")
	if err != nil {
		http.Error(w, "Failed to marshal JSON data", http.StatusInternalServerError)
		log.Printf("HTTP ERROR: Failed to marshal JSON data: %v\n", err)
		return
	}
	w.Write(jsonData)
	log.Println("HTTP: Exported expenses to JSON")
}

func (h *Handler) ImportCSV(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		log.Println("HTTP ERROR: Method not allowed")
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Error parsing form"})
		log.Printf("HTTP ERROR: Error parsing multipart form: %v\n", err)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Error retrieving file"})
		log.Printf("HTTP ERROR: Error retrieving file from form: %v\n", err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Error reading CSV file"})
		log.Printf("HTTP ERROR: Error reading CSV file: %v\n", err)
		return
	}
	if len(records) < 2 {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "CSV file has no data rows"})
		log.Println("HTTP ERROR: CSV file is empty or has no data rows")
		return
	}

	stringEscape := regexp.MustCompile(`[^a-zA-Z0-9_ \.]*`)
	header := records[0]
	var nameIdx, categoryIdx, amountIdx, dateIdx int = -1, -1, -1, -1
	for i, col := range header {
		colLower := strings.ToLower(strings.TrimSpace(stringEscape.ReplaceAllString(col, "")))
		switch colLower {
		case "name":
			nameIdx = i
		case "category":
			categoryIdx = i
		case "amount":
			amountIdx = i
		case "date":
			dateIdx = i
		}
	}
	if nameIdx == -1 || categoryIdx == -1 || amountIdx == -1 || dateIdx == -1 {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "CSV missing required columns"})
		log.Println("HTTP ERROR: CSV file missing required columns")
		return
	}

	categoryMap := make(map[string]string)
	for _, cat := range h.config.Categories {
		catLower := strings.ToLower(cat)
		categoryMap[catLower] = cat
	}

	imported := 0
	var newCategories []string
	var skippedDetails []string

	dateFormats := []string{
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02",
		"01/02/2006",
		"01/02/06",
		"1/2/2006",
		"1/2/06",
		"02/01/2006",
		"Jan 2, 2006",
		"2 Jan 2006",
		"January 2, 2006",
		"2006-01-02T15:04:05",
	}

	for i, record := range records {
		if i == 0 {
			continue
		}
		if len(record) <= slices.Max([]int{nameIdx, categoryIdx, amountIdx, dateIdx}) {
			msg := fmt.Sprintf("row %d: insufficient columns", i)
			log.Println("Warning:", msg)
			skippedDetails = append(skippedDetails, msg)
			continue
		}

		name := strings.TrimSpace(stringEscape.ReplaceAllString(record[nameIdx], ""))
		if name == "" {
			name = "-"
		}

		rawCategory := strings.TrimSpace(stringEscape.ReplaceAllString(record[categoryIdx], ""))
		if rawCategory == "" {
			msg := fmt.Sprintf("row %d: missing category", i)
			log.Println("Warning:", msg)
			skippedDetails = append(skippedDetails, msg)
			continue
		}
		categoryLower := strings.ToLower(rawCategory)
		category := rawCategory
		if normalized, exists := categoryMap[categoryLower]; exists {
			category = normalized
		} else {
			categoryMap[categoryLower] = rawCategory
			newCategories = append(newCategories, rawCategory)
		}

		amountStr := strings.TrimSpace(record[amountIdx])
		amount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			msg := fmt.Sprintf("row %d: invalid amount '%s'", i, amountStr)
			log.Println("Warning:", msg)
			skippedDetails = append(skippedDetails, msg)
			continue
		}

		dateStr := strings.TrimSpace(record[dateIdx])
		var date time.Time
		var parsedDate bool
		for _, format := range dateFormats {
			if d, err := time.ParseInLocation(format, dateStr, time.Local); err == nil {
				date = d.UTC()
				parsedDate = true
				break
			}
		}
		if !parsedDate {
			msg := fmt.Sprintf("row %d: invalid date format '%s'", i, dateStr)
			log.Println("Warning:", msg)
			skippedDetails = append(skippedDetails, msg)
			continue
		}

		expense := &config.Expense{
			ID:       "",
			Name:     name,
			Category: category,
			Amount:   amount,
			Date:     date,
		}
		if err := h.storage.SaveExpense(expense); err != nil {
			msg := fmt.Sprintf("row %d: error saving expense: %v", i, err)
			log.Println("Error:", msg)
			skippedDetails = append(skippedDetails, msg)
			continue
		}

		imported++
		time.Sleep(10 * time.Millisecond)
	}

	if len(newCategories) > 0 {
		updatedCategories := append(h.config.Categories, newCategories...)
		if err := h.config.UpdateCategories(updatedCategories); err != nil {
			log.Printf("Warning: Failed to update categories: %v\n", err)
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":          "success",
		"imported":        imported,
		"new_categories":  newCategories,
		"skipped":         len(skippedDetails),
		"skipped_details": skippedDetails,
		"total_processed": len(records) - 1,
	})
	log.Printf("HTTP: Imported %d expenses from CSV file\n", imported)
}

func (h *Handler) ImportJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		log.Println("HTTP ERROR: Method not allowed")
		return
	}
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Error parsing form"})
		log.Printf("HTTP ERROR: Error parsing multipart form: %v\n", err)
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Error retrieving file"})
		log.Printf("HTTP ERROR: Error retrieving file from form: %v\n", err)
		return
	}
	defer file.Close()

	var expenses []*config.Expense
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&expenses); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Error parsing JSON file"})
		log.Printf("HTTP ERROR: Error parsing JSON file: %v\n", err)
		return
	}
	if len(expenses) == 0 {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "JSON file contains no expenses"})
		log.Println("HTTP ERROR: JSON file contains no expenses")
		return
	}

	stringEscape := regexp.MustCompile(`[^a-zA-Z0-9_ \.]*`)
	// Get current categories as lowercase to match new ones and replace as needed
	categoryMap := make(map[string]string)
	for _, cat := range h.config.Categories {
		catLower := strings.ToLower(cat)
		categoryMap[catLower] = cat
	}
	// Process elements
	imported := 0
	var newCategories []string
	for i, expense := range expenses {
		// Handle data
		if expense.Name == "" {
			expense.Name = "-"
		} else {
			expense.Name = strings.TrimSpace(stringEscape.ReplaceAllString(expense.Name, ""))
		}
		if expense.Category == "" {
			log.Printf("Warning: Skipping expense %d due to missing category\n", i+1)
			continue
		} else {
			expense.Category = strings.TrimSpace(stringEscape.ReplaceAllString(expense.Category, ""))
		}
		if expense.Amount <= 0 {
			log.Printf("Warning: Skipping expense %d due to bad amount: %f\n", i+1, expense.Amount)
			continue
		}
		if expense.Date.IsZero() {
			log.Printf("Warning: Skipping expense %d due to missing date\n", i+1)
			continue
		}
		// Set date to UTC for consistency
		expense.Date = expense.Date.UTC()
		// Handle category
		categoryLower := strings.ToLower(expense.Category)
		if normalized, exists := categoryMap[categoryLower]; exists {
			expense.Category = normalized
		} else {
			categoryMap[categoryLower] = expense.Category // Add to map for future steps
			newCategories = append(newCategories, expense.Category)
		}

		// Save the expense
		expense.ID = "" // Ensure new ID value
		if err := h.storage.SaveExpense(expense); err != nil {
			log.Printf("Error saving expense %d: %v\n", i+1, err)
			continue
		}
		imported++
		// Throttle for storage - usually not needed but can avoid error for large files
		time.Sleep(10 * time.Millisecond)
	}

	// Update the config with new categories if any
	if len(newCategories) > 0 {
		updatedCategories := append(h.config.Categories, newCategories...)
		if err := h.config.UpdateCategories(updatedCategories); err != nil {
			log.Printf("Warning: Failed to update categories: %v\n", err)
		}
	}
	// Return success response with summary
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":          "success",
		"imported":        imported,
		"new_categories":  newCategories,
		"skipped":         len(expenses) - imported,
		"total_processed": len(expenses),
	})
	log.Printf("HTTP: Imported %d expenses from JSON file\n", imported)
}
