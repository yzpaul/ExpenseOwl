let currencySymbol = "$"; // Default to USD
let currentDate = new Date();
let allExpenses = [];
let startDate = 1;
let currentEditRow = null;
let config;
let currentSort = { column: "date", direction: "desc" };

function formatCurrency(amount) {
  let formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  // Currencies commonly used after the amount
  const postfixCurrencies = new Set(["kr", "kr.", "Fr", "zł"]);
  if (postfixCurrencies.has(currencySymbol)) {
    return `${formattedAmount} ${currencySymbol}`;
  }
  return `${currencySymbol} ${formattedAmount}`;
}

function formatMonth(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    timeZone: getUserTimeZone(),
  });
}

function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getISODateWithLocalTime(dateInput) {
  const [year, month, day] = dateInput.split("-").map(Number);
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const localDateTime = new Date(year, month - 1, day, hours, minutes, seconds);
  return localDateTime.toISOString();
}

function formatDateFromUTC(utcDateString) {
  const date = new Date(utcDateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

function updateMonthDisplay() {
  document.getElementById("currentMonth").textContent = formatMonth(currentDate);
  const now = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
  document.getElementById("nextMonth").disabled = isCurrentMonth;
}

function getMonthBounds(date) {
  //assume month ALWAYS starts on 1
  const localDate = new Date(date);
    const startLocal = new Date(localDate.getFullYear(), localDate.getMonth(), 1);
    const endLocal = new Date(localDate.getFullYear(), localDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const start = new Date(startLocal.toISOString());
    const end = new Date(endLocal.toISOString());
    return { start, end };
}

function getMonthExpenses(expenses) {
  const { start, end } = getMonthBounds(currentDate);
  return expenses
    .filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= start && expDate <= end;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function sortByColumn(column) {
  const monthExpenses = getMonthExpenses(allExpenses);

  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.column = column;
    currentSort.direction = "asc";
  }

  const sorted = [...monthExpenses].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    if (column === "amount") {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    } else if (column === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else {
      aVal = aVal.toLowerCase?.() || "";
      bVal = bVal.toLowerCase?.() || "";
    }

    if (aVal < bVal) return currentSort.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === "asc" ? 1 : -1;
    return 0;
  });

  document.getElementById("tableContainer").innerHTML = createTable(sorted);
}

function getSortArrow(column) {
  if (currentSort.column !== column) return "";
  return currentSort.direction === "asc" ? "▲" : "▼";
}

function createTable(expenses) {
  if (expenses.length === 0) {
    return `<div class="no-data">No expenses recorded for this month</div>`;
  }
  return `
    <style>
      th {
        cursor: pointer;
        user-select: none;
      }
      th:hover {
        background-color: rgba(128, 128, 128, 0.1);
      }
    </style>

    <table class="expense-table">
      <thead>
        <tr>
          <th onclick="sortByColumn('name')">Name ${getSortArrow("name")}</th>
          <th onclick="sortByColumn('category')">Category ${getSortArrow("category")}</th>
          <th onclick="sortByColumn('amount')">Amount ${getSortArrow("amount")}</th>
          <th class="date-header" onclick="sortByColumn('date')">Date ${getSortArrow("date")}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${expenses
          .map(
            (expense) => `
            <tr>
              <td>${expense.name}</td>
              <td>${expense.category}</td>
              <td class="amount">${formatCurrency(expense.amount)}</td>
              <td class="date-column">${formatDateFromUTC(expense.date)}</td>
              <td>
                <button class="delete-button" onclick="editExpense('${expense.id}', '${expense.name}', '${expense.category}', ${expense.amount}, '${expense.date}')">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="delete-button" onclick="showDeleteModal('${expense.id}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function updateTable() {
  const monthExpenses = getMonthExpenses(allExpenses);
  const tableContainer = document.getElementById("tableContainer");
  tableContainer.innerHTML = createTable(monthExpenses);
}

function addSplitRow(splitBtn) {
  const mainForm = splitBtn.closest("form");
  const mainRow = splitBtn.closest("tr");

  // Store original amount only once
  if (!mainForm.dataset.originalAmount) {
    mainForm.dataset.originalAmount = parseFloat(mainForm.elements.amount.value || 0);
  }

  // Clone the form template
  const splitForm = mainForm.cloneNode(true);
  const categorySelect = splitForm.elements.category;
  populateCategorySelect(categorySelect)
  splitForm.dataset.split = "true";
  splitForm.elements.id.value = "";
  splitForm.elements.name.value = mainForm.elements.name.value + " (split)";
  splitForm.elements.amount.value = "0";

  // Clear any error
  splitForm.querySelector(".form-error").textContent = "";

  // 🔒 Hide the button group for this split
  const buttonGroup = splitForm.querySelectorAll(".form-group")[4]; // the 5th form-group (buttons)
  if (buttonGroup) buttonGroup.style.display = "none";

  // Insert after last split or main
  let insertAfter = mainRow;
  while (
    insertAfter.nextElementSibling &&
    insertAfter.nextElementSibling.classList.contains("edit-row") &&
    insertAfter.nextElementSibling.querySelector("form")?.dataset.split === "true"
  ) {
    insertAfter = insertAfter.nextElementSibling;
  }

  const splitRow = document.createElement("tr");
  splitRow.classList.add("edit-row");

  const td = document.createElement("td");
  td.colSpan = 5;

  const wrapper = document.createElement("div");
  wrapper.className = "form-container";
  wrapper.appendChild(splitForm);
  td.appendChild(wrapper);
  splitRow.appendChild(td);

  insertAfter.parentNode.insertBefore(splitRow, insertAfter.nextElementSibling);
}


// function validateAndSyncSplitRows(mainForm, splitForm) {
//   const originalTotal = parseFloat(mainForm.dataset.originalAmount || 0);
//   const mainAmountField = mainForm.elements.amount;
//   const splitAmountField = splitForm.elements.amount;
//   const errorDiv = mainForm.querySelector(".form-error");
//   errorDiv.textContent = "Original amount before split: "+originalTotal;

//   let mainAmount = parseFloat(mainAmountField.value || 0);
//   let splitAmount = parseFloat(splitAmountField.value || 0);

//   if (isNaN(mainAmount)) mainAmount = 0;
//   if (isNaN(splitAmount)) splitAmount = 0;

//   // Auto-adjust the other field if one changes to keep total consistent
//   const activeElement = document.activeElement;
//   if (activeElement === mainAmountField) {
//     // Adjust split amount so total matches originalTotal
//     splitAmountField.value = (originalTotal - mainAmount).toFixed(2);
//   } else if (activeElement === splitAmountField) {
//     // Adjust main amount so total matches originalTotal
//     mainAmountField.value = (originalTotal - splitAmount).toFixed(2);
//   }

//   return true;
// }

function cancelEdit() {
  if (currentEditRow) {
    // Remove all following split rows
    let next = currentEditRow.nextElementSibling;
    while (
      next &&
      next.classList.contains("edit-row") &&
      next.querySelector("form")?.dataset.split === "true"
    ) {
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }

    // Remove the main edit row
    currentEditRow.remove();
    currentEditRow = null;
  }
}

function editExpense(id, name, category, amount, date) {
  cancelEdit();

  const row = document.querySelector(`button[onclick*="${id}"]`).closest("tr");
  const editTemplate = document.getElementById("editFormTemplate").content.cloneNode(true);
  
  const editRow = editTemplate.querySelector("tr");
  const form = editRow.querySelector("form");

  const categorySelect = form.elements.category;
  populateCategorySelect(categorySelect);

  form.elements.id.value = id;
  form.elements.name.value = name;
  form.elements.category.value = category;
  form.elements.amount.value = amount;
  form.elements.date.value = new Date(date).toISOString().slice(0, 10);

  // Store original amount for validation
  form.dataset.originalAmount = amount;

  row.parentNode.insertBefore(editRow, row.nextSibling);
  currentEditRow = editRow;
}
async function submitEdit(event) {
  event.preventDefault();
  const form = event.target;
  const parentRow = form.closest("tr");
  const errorDiv = form.querySelector(".form-error");
  errorDiv.textContent = "";

  const originalTotal = parseFloat(form.dataset.originalAmount);

  // Collect main form data
  const updates = [{
    url: `/expense/edit?id=${form.elements.id.value}`,
    body: {
      name: form.elements.name.value,
      category: form.elements.category.value,
      amount: parseFloat(form.elements.amount.value),
      date: getISODateWithLocalTime(form.elements.date.value),
    }
  }];

  let totalAmount = updates[0].body.amount;

  // Look for up to 20 following split rows
  let nextRow = parentRow.nextElementSibling;
  let splitCount = 0;
  while (nextRow && nextRow.classList.contains("edit-row") && splitCount < 20) {
    const splitForm = nextRow.querySelector("form");
    if (!splitForm || !splitForm.dataset.split) break;

    const amount = parseFloat(splitForm.elements.amount.value);
    totalAmount += amount;

    updates.push({
      url: "/expense",
      body: {
        name: splitForm.elements.name.value,
        category: splitForm.elements.category.value,
        amount,
        date: getISODateWithLocalTime(splitForm.elements.date.value),
      }
    });

    nextRow = nextRow.nextElementSibling;
    splitCount++;
  }

  if (Math.abs(totalAmount - originalTotal) > 0.005) {
    errorDiv.textContent = `Total must equal original amount: ${originalTotal.toFixed(2)} (now: ${totalAmount.toFixed(2)})`;
    return;
  }

  try {
    await Promise.all(
      updates.map(update =>
        fetch(update.url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update.body),
        })
      )
    );
    cancelEdit();
    await initialize();
  } catch (error) {
    errorDiv.textContent = "Failed to save expenses.";
    console.error(error);
  }
}

function populateCategorySelect(selectElement) {
  selectElement.innerHTML = config.categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}


async function initialize() {
  try {
    // Fetch config
    const configResponse = await fetch("/user_settings");
    if (!configResponse.ok) throw new Error("Failed to fetch configuration");
    config = await configResponse.json();
    const categorySelect = document.getElementById("category");
    populateCategorySelect(categorySelect);

    currencySymbol = config.currency;
    startDate = config.startDate;

    // Fetch expenses
    const response = await fetch("/expenses");
    if (!response.ok) throw new Error("Failed to fetch data");
    allExpenses = await response.json();

    updateMonthDisplay();
    updateTable();
  } catch (error) {
    console.error("Failed to initialize table:", error);
    document.getElementById("tableContainer").innerHTML = '<div class="no-data">Failed to load expenses</div>';
  }
}

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, currentDate.getHours(), currentDate.getMinutes());
  updateMonthDisplay();
  updateTable();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1, currentDate.getHours(), currentDate.getMinutes());
  updateMonthDisplay();
  updateTable();
});

let expenseToDelete = null;

function showDeleteModal(id) {
  expenseToDelete = id;
  document.getElementById("deleteModal").classList.add("active");
}

function closeDeleteModal() {
  expenseToDelete = null;
  document.getElementById("deleteModal").classList.remove("active");
}

async function confirmDelete() {
  if (!expenseToDelete) return;
  try {
    const response = await fetch(`/expense/delete?id=${expenseToDelete}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete expense");

    await initialize();
    closeDeleteModal();
  } catch (error) {
    console.error("Error deleting expense:", error);
    alert("Failed to delete expense. Please try again.");
  }
}

document.getElementById("deleteModal").addEventListener("click", (e) => {
  if (e.target.className === "modal active") {
    closeDeleteModal();
  }
});

document.getElementById("expenseForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const editId = form.dataset.editId;

  const formData = {
    name: document.getElementById("name").value,
    category: document.getElementById("category").value,
    amount: parseFloat(document.getElementById("amount").value),
    date: getISODateWithLocalTime(document.getElementById("date").value),
  };

  try {
    const url = editId ? `/expense/edit?id=${editId}` : "/expense";
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const messageDiv = document.getElementById("formMessage");
    if (response.ok) {
      messageDiv.textContent = editId ? "Expense updated successfully!" : "Expense added successfully!";
      messageDiv.className = "form-message success";
      form.reset();
      delete form.dataset.editId;
      form.querySelector('button[type="submit"]').textContent = "Add Expense";
      await initialize();

      // Reset date input to today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      document.getElementById("date").value = `${year}-${month}-${day}`;
    } else {
      const error = await response.json();
      messageDiv.textContent = `Error: ${error.error || "Failed to save expense"}`;
      messageDiv.className = "form-message error";
    }

    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.className = "form-message";
    }, 3000);
  } catch (error) {
    console.error("Error saving expense:", error);
    const messageDiv = document.getElementById("formMessage");
    messageDiv.textContent = "Error: Failed to save expense";
    messageDiv.className = "form-message error";
  }
});

document.addEventListener("DOMContentLoaded", initialize);
window.formatCurrency = formatCurrency;
window.formatMonth = formatMonth;
window.getUserTimeZone = getUserTimeZone;
window.getISODateWithLocalTime = getISODateWithLocalTime;
window.formatDateFromUTC = formatDateFromUTC;
window.updateMonthDisplay = updateMonthDisplay;
window.getMonthBounds = getMonthBounds;
window.getMonthExpenses = getMonthExpenses;
window.sortByColumn = sortByColumn;
window.getSortArrow = getSortArrow;
window.createTable = createTable;
window.updateTable = updateTable;
window.addSplitRow = addSplitRow;
window.cancelEdit = cancelEdit;
window.editExpense = editExpense;
window.submitEdit = submitEdit;
window.initialize = initialize;
window.showDeleteModal = showDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
