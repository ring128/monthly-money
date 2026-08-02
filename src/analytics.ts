import type { Genre, GenreTotal, MoneyRecord, MoneyType, MonthTotal, YearTotal } from "./types";

export const getMonthTotal = (records: MoneyRecord[], yearMonth: string): MonthTotal => {
  const monthRecords = records.filter((record) => record.yearMonth === yearMonth);
  const income = sumByType(monthRecords, "income");
  const expense = sumByType(monthRecords, "expense");

  return {
    yearMonth,
    income,
    expense,
    balance: income - expense
  };
};

export const getGenreTotals = (
  records: MoneyRecord[],
  genres: Genre[],
  type: MoneyType,
  yearMonth?: string,
  year?: number
): GenreTotal[] => {
  const genreMap = new Map(genres.map((genre) => [genre.id, genre]));
  const totals = new Map<string, { amount: number; count: number }>();

  for (const record of records) {
    if (record.type !== type) continue;
    if (yearMonth && record.yearMonth !== yearMonth) continue;
    if (year !== undefined && record.year !== year) continue;

    const current = totals.get(record.genreId) ?? { amount: 0, count: 0 };
    current.amount += record.amount;
    current.count += 1;
    totals.set(record.genreId, current);
  }

  return [...totals.entries()]
    .map(([genreId, total]) => ({
      genre: genreMap.get(genreId) ?? { id: genreId, name: "未分類", type },
      amount: total.amount,
      count: total.count
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const getRecordsForGenre = (
  records: MoneyRecord[],
  type: MoneyType,
  genreId: string,
  yearMonth: string
) =>
  records
    .filter(
      (record) =>
        record.type === type &&
        record.genreId === genreId &&
        record.yearMonth === yearMonth
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getMonthTotals = (records: MoneyRecord[]): MonthTotal[] => {
  const months = [...new Set(records.map((record) => record.yearMonth))].sort().reverse();
  return months.map((yearMonth) => getMonthTotal(records, yearMonth));
};

export const getYearTotals = (records: MoneyRecord[]): YearTotal[] => {
  const years = [...new Set(records.map((record) => record.year))].sort((a, b) => b - a);

  return years.map((year) => {
    const yearRecords = records.filter((record) => record.year === year);
    const income = sumByType(yearRecords, "income");
    const expense = sumByType(yearRecords, "expense");

    return {
      year,
      income,
      expense,
      balance: income - expense
    };
  });
};

const sumByType = (records: MoneyRecord[], type: MoneyType) =>
  records
    .filter((record) => record.type === type)
    .reduce((total, record) => total + record.amount, 0);
