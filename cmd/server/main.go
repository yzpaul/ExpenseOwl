package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/tanq16/budgetlord/internal/api"
	"github.com/tanq16/budgetlord/internal/config"
	"github.com/tanq16/budgetlord/internal/storage/jsonfile"
	"github.com/tanq16/budgetlord/internal/web"
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

	// Set up API routes
	http.HandleFunc("/expense", handler.AddExpense)
	http.HandleFunc("/expenses", handler.GetExpenses)
	// Replace the previous table route with this:
	http.HandleFunc("/table", handler.ServeTableView)

	// http.HandleFunc("/expenses/processed", handler.GetProcessedExpenses)

	// Set up static file serving
	// http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(web.GetStaticFileSystem())))

	// Set up index page
	// Update the root handler
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		if err := web.ServeTemplate(w, "index.html"); err != nil {
			http.Error(w, "Failed to serve template", http.StatusInternalServerError)
			return
		}
	})

	// Start server
	log.Printf("Starting server on port %s...", cfg.ServerPort)
	if err := http.ListenAndServe(":"+cfg.ServerPort, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
