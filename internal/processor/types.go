package processor

import "time"

// MonthlyTotal represents total expenses for a category in a specific month
type MonthlyTotal struct {
	Month    time.Time `json:"month"`
	Category string    `json:"category"`
	Total    float64   `json:"total"`
}

// CategoryBreakdown represents total and percentage for a category
type CategoryBreakdown struct {
	Category   string  `json:"category"`
	Total      float64 `json:"total"`
	Percentage float64 `json:"percentage"`
}

// TopExpense represents a single expense in the top expenses list
type TopExpense struct {
	Name     string    `json:"name"`
	Category string    `json:"category"`
	Amount   float64   `json:"amount"`
	Date     time.Time `json:"date"`
}

// ProcessedData contains all processed information for visualizations
type ProcessedData struct {
	MonthlyTotals     []MonthlyTotal      `json:"monthlyTotals"`
	CategoryBreakdown []CategoryBreakdown `json:"categoryBreakdown"`
	TopExpenses       []TopExpense        `json:"topExpenses"`
}
