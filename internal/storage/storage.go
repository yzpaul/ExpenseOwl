package storage

import (
	"github.com/tanq16/budgetlord/internal/models"
)

type Storage interface {
	SaveExpense(expense *models.Expense) error
	GetAllExpenses() ([]*models.Expense, error)
}
