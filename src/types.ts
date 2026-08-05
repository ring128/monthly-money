export type MoneyType = "expense" | "income";

export type Genre = {
  id: string;
  name: string;
  type: MoneyType;
};

export type MoneyRecord = {
  id: string;
  title: string;
  amount: number;
  type: MoneyType;
  genreId: string;
  createdAt: string;
  yearMonth: string;
  year: number;
  imageDataUrl?: string;
};

export type AppState = {
  genres: Genre[];
  records: MoneyRecord[];
};

export type AppSettings = {
  showIncome: boolean;
  imageEnabled: boolean;
  monthStartDay: number;
};

export type GenreTotal = {
  genre: Genre;
  amount: number;
  count: number;
};

export type MonthTotal = {
  yearMonth: string;
  income: number;
  expense: number;
  balance: number;
};

export type YearTotal = {
  year: number;
  income: number;
  expense: number;
  balance: number;
};

export type Screen =
  | { name: "home" }
  | { name: "past" }
  | { name: "settings" }
  | { name: "month"; yearMonth: string }
  | { name: "genre"; yearMonth: string; type: MoneyType; genreId: string }
  | { name: "record"; recordId: string }
  | { name: "year"; year: number };
