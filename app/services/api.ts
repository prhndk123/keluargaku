import { Backendless, initBackendless } from "@/lib/backendless";

export type Member = {
  objectId?: string;
  name: string;
  role: string;
  birthDate: number | string; // stored as datetime
  alias: string;
  password?: string;
};

export type Finance = {
  objectId?: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: number | string;
  isRecurring: boolean;
};

export type RecurringExpense = {
  objectId?: string;
  description: string;
  amount: number;
  dateSet: number; // 1-31
};

export type FamilyEvent = {
  objectId?: string;
  title: string;
  date: number | string;
  type: string;
};

function db<T>(table: string) {
  initBackendless();
  return Backendless.Data.of(table) as unknown as {
    save: (obj: Partial<T>) => Promise<T>;
    find: (query?: unknown) => Promise<T[]>;
    remove: (obj: { objectId: string }) => Promise<unknown>;
  };
}

function qb() {
  initBackendless();
  return (Backendless as unknown as {
    DataQueryBuilder: { create: () => DQB };
  }).DataQueryBuilder.create();
}

type DQB = {
  setWhereClause: (w: string) => DQB;
  setSortBy: (s: string | string[]) => DQB;
  setPageSize: (n: number) => DQB;
};

// -------- Members --------
export const membersApi = {
  list: () => db<Member>("Members").find(qb().setSortBy("birthDate ASC")),
  create: (m: Omit<Member, "objectId">) => db<Member>("Members").save(m),
  update: (m: Member) => db<Member>("Members").save(m),
  remove: (id: string) => db<Member>("Members").remove({ objectId: id }),
};

// -------- Events --------
export const eventsApi = {
  list: () => db<FamilyEvent>("Events").find(qb().setSortBy("date ASC")),
  upcoming: (limit = 5) =>
    db<FamilyEvent>("Events").find(
      qb()
        .setWhereClause(`date >= ${Date.now()}`)
        .setSortBy("date ASC")
        .setPageSize(limit),
    ),
  create: (e: Omit<FamilyEvent, "objectId">) => db<FamilyEvent>("Events").save(e),
  update: (e: FamilyEvent) => db<FamilyEvent>("Events").save(e),
  remove: (id: string) => db<FamilyEvent>("Events").remove({ objectId: id }),
};

// -------- Finances --------
export const financesApi = {
  list: () => db<Finance>("Finances").find(qb().setSortBy("date DESC").setPageSize(100)),
  byMonth: (year: number, month: number) => {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 1).getTime();
    return db<Finance>("Finances").find(
      qb().setWhereClause(`date >= ${start} AND date < ${end}`).setSortBy("date DESC"),
    );
  },
  create: (f: Omit<Finance, "objectId">) => db<Finance>("Finances").save(f),
  update: (f: Finance) => db<Finance>("Finances").save(f),
  remove: (id: string) => db<Finance>("Finances").remove({ objectId: id }),
};

// -------- Recurring Expenses --------
export const recurringApi = {
  list: () =>
    db<RecurringExpense>("RecurringExpenses").find(qb().setSortBy("dateSet ASC")),
  create: (r: Omit<RecurringExpense, "objectId">) =>
    db<RecurringExpense>("RecurringExpenses").save(r),
  update: (r: RecurringExpense) => db<RecurringExpense>("RecurringExpenses").save(r),
  remove: (id: string) => db<RecurringExpense>("RecurringExpenses").remove({ objectId: id }),
};

// -------- Forecast --------
/**
 * Rata-rata pengeluaran N bulan terakhir (default 3), lalu saran target income = rata2 * 1.1.
 */
export async function getForecast(monthsBack = 3): Promise<{
  averageExpense: number;
  suggestedIncome: number;
  months: { label: string; income: number; expense: number }[];
}> {
  const now = new Date();
  const months: { label: string; income: number; expense: number }[] = [];
  let totalExpense = 0;
  for (let i = monthsBack; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const rows = await financesApi.byMonth(d.getFullYear(), d.getMonth());
    const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    totalExpense += expense;
    months.push({
      label: d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
      income,
      expense,
    });
  }
  const averageExpense = monthsBack > 0 ? Math.round(totalExpense / monthsBack) : 0;
  const suggestedIncome = Math.round(averageExpense * 1.1);
  return { averageExpense, suggestedIncome, months };
}
