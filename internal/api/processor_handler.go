package api

import (
	"net/http"

	"github.com/tanq16/budgetlord/internal/processor"
)

func (h *Handler) GetProcessedExpenses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get all expenses
	expenses, err := h.storage.GetAllExpenses()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Failed to retrieve expenses"})
		return
	}

	// Process expenses
	p := processor.New()
	processedData, err := p.ProcessExpenses(expenses)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Failed to process expenses"})
		return
	}

	writeJSON(w, http.StatusOK, processedData)
}
