export const yen = (value: number) => `${Math.round(value).toLocaleString("ja-JP")}円`;

export const signedYen = (value: number) => {
  if (value > 0) return `+${yen(value)}`;
  if (value < 0) return `-${yen(Math.abs(value))}`;
  return yen(0);
};

export const rateText = (value: number) => `${Math.round(value * 10) / 10}%`;
