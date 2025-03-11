package config

import (
	"errors"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	ServerPort  string
	StoragePath string
	Categories  []string
	Currency    string
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

var currencySymbols = map[string]string{
	"usd": "$",    // US Dollar
	"eur": "€",    // Euro
	"gbp": "£",    // British Pound
	"jpy": "¥",    // Japanese Yen
	"cny": "¥",    // Chinese Yuan
	"krw": "₩",    // Korean Won
	"inr": "₹",    // Indian Rupee
	"rub": "₽",    // Russian Ruble
	"brl": "R$",   // Brazilian Real
	"zar": "R",    // South African Rand
	"aed": "AED",  // UAE Dirham
	"aud": "A$",   // Australian Dollar
	"cad": "C$",   // Canadian Dollar
	"chf": "Fr",   // Swiss Franc
	"hkd": "HK$",  // Hong Kong Dollar
	"sgd": "S$",   // Singapore Dollar
	"thb": "฿",    // Thai Baht
	"try": "₺",    // Turkish Lira
	"mxn": "Mex$", // Mexican Peso
	"php": "₱",    // Philippine Peso
	"pln": "zł",   // Polish Złoty
	"sek": "kr",   // Swedish Krona
	"nzd": "NZ$",  // New Zealand Dollar
	"dkk": "kr.",  // Danish Krone
	"idr": "Rp",   // Indonesian Rupiah
	"ils": "₪",    // Israeli New Shekel
	"vnd": "₫",    // Vietnamese Dong
	"myr": "RM",   // Malaysian Ringgit
}

type Expense struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Category string    `json:"category"`
	Amount   float64   `json:"amount"`
	Date     time.Time `json:"date"`
}

func (e *Expense) Validate() error {
	if e.Name == "" {
		return errors.New("expense name is required")
	}
	if e.Category == "" {
		return errors.New("category is required")
	}
	if e.Amount <= 0 {
		return errors.New("amount must be greater than 0")
	}
	return nil
}

func NewConfig(dataPath string) *Config {
	categories := defaultCategories
	if envCategories := os.Getenv("EXPENSE_CATEGORIES"); envCategories != "" {
		categories = strings.Split(envCategories, ",")
		for i := range categories {
			categories[i] = strings.TrimSpace(categories[i])
		}
	}
	log.Println("Using custom categories from environment variables")
	currency := "$" // Default to USD
	if envCurrency := strings.ToLower(os.Getenv("CURRENCY")); envCurrency != "" {
		if symbol, exists := currencySymbols[envCurrency]; exists {
			currency = symbol
		}
	}
	log.Println("Using custom currency from environment variables")
	finalPath := ""
	if dataPath == "data" {
		finalPath = filepath.Join(".", "data")
	} else {
		finalPath = filepath.Clean(dataPath)
	}
	log.Printf("Using data directory: %s\n", finalPath)
	return &Config{
		ServerPort:  "8080",
		StoragePath: finalPath,
		Categories:  categories,
		Currency:    currency,
	}
}
