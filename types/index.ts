export type TransactionType = "income" | "expense";

export type Category =
  | "Salary"
  | "Freelance"
  | "Food"
  | "Transport"
  | "Entertainment"
  | "Shopping"
  | "Healthcare"
  | "Utilities"
  | "Rent"
  | "Other";

export type Role = "admin" | "viewer";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: Category;
  type: TransactionType;
  description: string;
}

export type Frequency = "weekly" | "monthly" | "yearly";

export interface RecurringTransaction {
  id: string;
  amount: number;
  category: Category;
  type: TransactionType;
  description: string;
  frequency: Frequency;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
}

export interface Filters {
  search: string;
  category: Category | "all";
  type: TransactionType | "all";
  sortBy: "date" | "amount";
  sortOrder: "asc" | "desc";
}
