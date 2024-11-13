package storage

import (
	"expense-manager/internal/models"
)

type Storage interface {
	SaveExpense(expense *models.Expense) error
	GetAllExpenses() ([]*models.Expense, error)
}
