package jsonfile

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/tanq16/expenseowl/internal/models"
)

type Storage struct {
	filePath string
	mu       sync.RWMutex
}

type fileData struct {
	Expenses []*models.Expense `json:"expenses"`
}

func New(filePath string) (*Storage, error) {
	// Create storage directory if it doesn't exist
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %v", err)
	}

	// Create file if it doesn't exist
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		initialData := fileData{Expenses: []*models.Expense{}}
		data, err := json.Marshal(initialData)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal initial data: %v", err)
		}
		if err := os.WriteFile(filePath, data, 0644); err != nil {
			return nil, fmt.Errorf("failed to create storage file: %v", err)
		}
	}

	return &Storage{
		filePath: filePath,
	}, nil
}

func (s *Storage) SaveExpense(expense *models.Expense) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Read current data
	data, err := s.readFile()
	if err != nil {
		return fmt.Errorf("failed to read storage file: %v", err)
	}

	// Generate UUID if not provided
	if expense.ID == "" {
		expense.ID = uuid.New().String()
	}

	// Set creation time if not provided
	if expense.Date.IsZero() {
		expense.Date = time.Now()
	}

	// Add new expense
	data.Expenses = append(data.Expenses, expense)

	// Write back to file
	return s.writeFile(data)
}

func (s *Storage) DeleteExpense(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Read current data
	data, err := s.readFile()
	if err != nil {
		return fmt.Errorf("failed to read storage file: %v", err)
	}

	// Find and remove the expense
	found := false
	newExpenses := make([]*models.Expense, 0, len(data.Expenses)-1)
	for _, exp := range data.Expenses {
		if exp.ID != id {
			newExpenses = append(newExpenses, exp)
		} else {
			found = true
		}
	}

	if !found {
		return fmt.Errorf("expense with ID %s not found", id)
	}

	// Update data with expense removed
	data.Expenses = newExpenses
	return s.writeFile(data)
}

func (s *Storage) GetAllExpenses() ([]*models.Expense, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := s.readFile()
	if err != nil {
		return nil, fmt.Errorf("failed to read storage file: %v", err)
	}

	return data.Expenses, nil
}

func (s *Storage) readFile() (*fileData, error) {
	content, err := os.ReadFile(s.filePath)
	if err != nil {
		return nil, err
	}

	var data fileData
	if err := json.Unmarshal(content, &data); err != nil {
		return nil, err
	}

	return &data, nil
}

func (s *Storage) writeFile(data *fileData) error {
	content, err := json.MarshalIndent(data, "", "    ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filePath, content, 0644)
}
