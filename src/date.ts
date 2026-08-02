export const getCurrentStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return {
    createdAt: now.toISOString(),
    yearMonth: `${year}-${month}`,
    year
  };
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
