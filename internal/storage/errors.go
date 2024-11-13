package storage

import "errors"

var (
	ErrExpenseNotFound = errors.New("expense not found")
	ErrInvalidExpense  = errors.New("invalid expense data")
)
