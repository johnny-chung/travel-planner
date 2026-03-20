export type ExpenseMember = {
  userId: string;
  name: string;
  email: string;
  image: string;
};

export type ExpenseItem = {
  _id: string;
  tripId: string;
  addedBy: string;
  description: string;
  date: string;
  amount: number;
  currency: string;
  type: "shared" | "own";
  createdAt: string;
};

export type ExpenseTab = "add" | "all" | "summary";
