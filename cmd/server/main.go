package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/tanq16/budgetlord/internal/api"
	"github.com/tanq16/budgetlord/internal/config"
	"github.com/tanq16/budgetlord/internal/storage/jsonfile"
)

func main() {
	cfg := config.NewConfig()

	// Ensure data directory exists
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Initialize storage
	storage, err := jsonfile.New(filepath.Join(dataDir, "expenses.json"))
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	// Initialize handler
	handler := api.NewHandler(storage)

	// Set up routes
	http.HandleFunc("/expense", handler.AddExpense)
	http.HandleFunc("/expenses", handler.GetExpenses)
	http.HandleFunc("/expenses/processed", handler.GetProcessedExpenses)

	// Start server
	log.Printf("Starting server on port %s...", cfg.ServerPort)
	if err := http.ListenAndServe(":"+cfg.ServerPort, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
