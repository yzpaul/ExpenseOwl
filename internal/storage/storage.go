package storage

import (
	"errors"

	"github.com/tanq16/expenseowl/internal/models"
)

var (
	ErrExpenseNotFound = errors.New("expense not found")
	ErrInvalidExpense  = errors.New("invalid expense data")
)

type Storage interface {
	SaveExpense(expense *models.Expense) error
	GetAllExpenses() ([]*models.Expense, error)
	DeleteExpense(id string) error
}
