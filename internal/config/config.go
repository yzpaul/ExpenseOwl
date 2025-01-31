package config

import (
	"os"
	"strings"
)

type Config struct {
	ServerPort  string
	StoragePath string
	Categories  []string
}

var defaultCategories = []string{
	"Food",
	"Groceries",
	"Travel",
	"Rent",
	"Utilities",
	"Entertainment",
	"Healthcare",
	"Shopping",
	"Miscellaneous",
}

func NewConfig() *Config {
	categories := defaultCategories
	if envCategories := os.Getenv("EXPENSE_CATEGORIES"); envCategories != "" {
		categories = strings.Split(envCategories, ",")
		for i := range categories {
			categories[i] = strings.TrimSpace(categories[i])
		}
	}
	return &Config{
		ServerPort:  "8080",
		StoragePath: "./data",
		Categories:  categories,
	}
}
