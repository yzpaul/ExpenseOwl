package processor

import (
	"sort"
	"time"

	"github.com/tanq16/budgetlord/internal/models"
)

type Processor struct{}

func New() *Processor {
	return &Processor{}
}

func (p *Processor) ProcessExpenses(expenses []*models.Expense) (*ProcessedData, error) {
	now := time.Now()

	return &ProcessedData{
		MonthlyTotals:     p.calculateMonthlyTotals(expenses, now),
		CategoryBreakdown: p.calculateCategoryBreakdown(expenses, now),
		TopExpenses:       p.getTopExpenses(expenses, now),
	}, nil
}

func (p *Processor) calculateMonthlyTotals(expenses []*models.Expense, now time.Time) []MonthlyTotal {
	// Create a map to store totals: month -> category -> total
	monthCategoryTotals := make(map[string]map[string]float64)

	// Get start date (6 months ago)
	sixMonthsAgo := now.AddDate(0, -6, 0)

	// Calculate totals
	for _, exp := range expenses {
		// Skip if expense is older than 6 months
		if exp.Date.Before(sixMonthsAgo) {
			continue
		}

		// Create month key in format "2006-01"
		monthKey := exp.Date.Format("2006-01")

		if monthCategoryTotals[monthKey] == nil {
			monthCategoryTotals[monthKey] = make(map[string]float64)
		}

		monthCategoryTotals[monthKey][exp.Category] += exp.Amount
	}

	// Convert map to slice of MonthlyTotal
	var result []MonthlyTotal

	for monthKey, categoryTotals := range monthCategoryTotals {
		monthTime, _ := time.Parse("2006-01", monthKey)

		for category, total := range categoryTotals {
			result = append(result, MonthlyTotal{
				Month:    monthTime,
				Category: category,
				Total:    total,
			})
		}
	}

	// Sort by month and category
	sort.Slice(result, func(i, j int) bool {
		if result[i].Month.Equal(result[j].Month) {
			return result[i].Category < result[j].Category
		}
		return result[i].Month.Before(result[j].Month)
	})

	return result
}

func (p *Processor) calculateCategoryBreakdown(expenses []*models.Expense, now time.Time) []CategoryBreakdown {
	categoryTotals := make(map[string]float64)
	var totalAmount float64

	// Get start of current month
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Calculate totals
	for _, exp := range expenses {
		if exp.Date.Before(startOfMonth) {
			continue
		}

		categoryTotals[exp.Category] += exp.Amount
		totalAmount += exp.Amount
	}

	// Convert to CategoryBreakdown slice
	var result []CategoryBreakdown
	for category, total := range categoryTotals {
		result = append(result, CategoryBreakdown{
			Category:   category,
			Total:      total,
			Percentage: (total / totalAmount) * 100,
		})
	}

	// Sort by total amount descending
	sort.Slice(result, func(i, j int) bool {
		return result[i].Total > result[j].Total
	})

	return result
}

func (p *Processor) getTopExpenses(expenses []*models.Expense, now time.Time) []TopExpense {
	// Get start of last month
	startOfLastMonth := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())

	// Filter expenses for current and last month
	var recentExpenses []TopExpense
	for _, exp := range expenses {
		if exp.Date.Before(startOfLastMonth) {
			continue
		}

		recentExpenses = append(recentExpenses, TopExpense{
			Name:     exp.Name,
			Category: exp.Category,
			Amount:   exp.Amount,
			Date:     exp.Date,
		})
	}

	// Sort by amount descending
	sort.Slice(recentExpenses, func(i, j int) bool {
		return recentExpenses[i].Amount > recentExpenses[j].Amount
	})

	// Return top 20 or all if less than 20
	if len(recentExpenses) > 20 {
		return recentExpenses[:20]
	}
	return recentExpenses
}
