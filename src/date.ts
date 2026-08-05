export const getCurrentStamp = (monthStartDay = 1) => createStamp(new Date(), monthStartDay);

export const getStampForDate = (dateValue: string, monthStartDay = 1) => {
  const now = new Date();
  const selected = parseInputDate(dateValue, now);
  selected.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return createStamp(selected, monthStartDay);
};

export const getTodayInputValue = () => formatInputDate(new Date());

export const getYearMonthFromIso = (iso: string, monthStartDay = 1) => {
  const date = new Date(iso);
  return getYearMonthParts(Number.isNaN(date.getTime()) ? new Date() : date, monthStartDay);
};

export const formatYearMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-");
  return `${year}年${Number(month)}月`;
};

export const formatRecordDateTime = (iso: string) => {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
};

const createStamp = (date: Date, monthStartDay: number) => {
  const { year, yearMonth } = getYearMonthParts(date, monthStartDay);

  return {
    createdAt: date.toISOString(),
    yearMonth,
    year
  };
};

const getYearMonthParts = (date: Date, monthStartDay: number) => {
  const startDay = clampMonthStartDay(monthStartDay);
  const effectiveStartDay = Math.min(startDay, daysInMonth(date.getFullYear(), date.getMonth()));
  const monthDate = date.getDate() < effectiveStartDay
    ? new Date(date.getFullYear(), date.getMonth() - 1, 1)
    : new Date(date.getFullYear(), date.getMonth(), 1);
  const year = monthDate.getFullYear();
  const month = String(monthDate.getMonth() + 1).padStart(2, "0");

  return {
    year,
    yearMonth: `${year}-${month}`
  };
};

const parseInputDate = (value: string, fallback: Date) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(fallback);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
};

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const clampMonthStartDay = (value: number) =>
  Number.isFinite(value) ? Math.min(31, Math.max(1, Math.trunc(value))) : 1;

const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();
