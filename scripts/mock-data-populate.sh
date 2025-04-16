#!/bin/bash

categories=("Food" "Groceries" "Travel" "Rent" "Income" "Utilities" "Entertainment" "Healthcare" "Shopping" "Miscellaneous")
RENT_AMOUNT=2000
CURRENT_YEAR=$(date +%Y)

random_amount() {
    min=$1
    max=$2
    echo "scale=2; $min + ($max - $min) * $RANDOM / 32767" | bc
}

for month in {0..11}; do
    date="$CURRENT_YEAR-$(printf "%02d" $((month + 1)))-14T14:00:00Z"

    # Add fixed rent expense for each month
    curl -X PUT http://localhost:8080/expense \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Monthly Rent\",
            \"category\": \"Rent\",
            \"amount\": $RENT_AMOUNT,
            \"date\": \"$date\"
        }"
    sleep 0.1

    # Add random income for each month
    amount=$(random_amount 2000 4000)
    curl -X PUT http://localhost:8080/expense \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Monthly Income\",
            \"category\": \"Income\",
            \"amount\": $amount,
            \"date\": \"$date\"
        }"

    num_expenses=$((RANDOM % 5 + 8))  # Random number between 8 and 12

    for ((i=1; i<=num_expenses; i++)); do
        day=$((RANDOM % 28 + 1))
        date="$CURRENT_YEAR-$(printf "%02d" $((month + 1)))-$(printf "%02d" $day)T14:00:00Z"
        while true; do
            category=${categories[$RANDOM % ${#categories[@]}]}
            if [ "$category" != "Rent" ] && [ "$category" != "Income" ]; then
                break
            fi
        done

        case $category in
            "Food")
                amount=$(random_amount 20 100)
                name="Restaurant meal"
                ;;
            "Groceries")
                amount=$(random_amount 50 200)
                name="Weekly groceries"
                ;;
            "Travel")
                amount=$(random_amount 100 500)
                name="Transportation"
                ;;
            "Utilities")
                amount=$(random_amount 80 200)
                name="Monthly utilities"
                ;;
            "Entertainment")
                amount=$(random_amount 30 150)
                name="Entertainment activity"
                ;;
            "Healthcare")
                amount=$(random_amount 50 300)
                name="Medical expense"
                ;;
            "Shopping")
                amount=$(random_amount 40 250)
                name="General shopping"
                ;;
            "Miscellaneous")
                amount=$(random_amount 20 100)
                name="Misc expense"
                ;;
        esac

        curl -X PUT http://localhost:8080/expense \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$name\",
                \"category\": \"$category\",
                \"amount\": $amount,
                \"date\": \"$date\"
            }"
        sleep 0.1
    done
done

echo "Mock data generation complete!"
