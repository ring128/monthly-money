import { rateText, yen } from "./format";
import type { GenreTotal } from "./types";

type Slice = GenreTotal & {
  color: string;
  start: number;
  sweep: number;
};

const colors = [
  "#dc2626",
  "#0891b2",
  "#7c3aed",
  "#ea580c",
  "#16a34a",
  "#db2777",
  "#4f46e5",
  "#ca8a04"
];

export const renderPieChart = (items: GenreTotal[]) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) {
    return `<div class="empty-chart">記録なし</div>`;
  }

  let cursor = 0;
  const slices: Slice[] = items.map((item, index) => {
    const sweep = 360 * item.amount / total;
    const slice = {
      ...item,
      color: colors[index % colors.length],
      start: cursor,
      sweep
    };
    cursor += sweep;
    return slice;
  });

  const paths = slices
    .map((slice) => {
      const label = `${slice.genre.name} ${yen(slice.amount)} ${rateText(slice.amount / total * 100)}`;
      return `
        <path
          d="${arcPath(110, 110, 94, slice.start, slice.sweep)}"
          fill="${slice.color}"
          data-pie-label="${escapeAttr(label)}"
          tabindex="0"
          role="button"
          aria-label="${escapeAttr(label)}"
        ></path>
      `;
    })
    .join("");

  return `
    <div class="pie-wrap">
      <svg class="pie" viewBox="0 0 220 220" aria-label="ジャンル割合">
        <circle cx="110" cy="110" r="94" fill="#eef2f7"></circle>
        ${paths}
        <circle cx="110" cy="110" r="50" fill="#ffffff"></circle>
      </svg>
      <div class="pie-center" id="pie-center">
        <span class="pie-title">合計</span>
        <strong>${yen(total)}</strong>
        <small>長押し/クリックで確認</small>
      </div>
    </div>
  `;
};

export const wirePieInteractions = () => {
  const center = document.querySelector<HTMLElement>("#pie-center");
  const paths = [...document.querySelectorAll<SVGPathElement>("[data-pie-label]")];
  let timer = 0;

  const show = (path: SVGPathElement) => {
    const label = path.dataset.pieLabel ?? "";
    const [name, amount, rate] = label.split(" ");
    if (!center || !name || !amount || !rate) return;
    center.innerHTML = `<span class="pie-title">${name}</span><strong>${amount}</strong><small>${rate}</small>`;
  };

  for (const path of paths) {
    path.addEventListener("click", () => show(path));
    path.addEventListener("focus", () => show(path));
    path.addEventListener("pointerdown", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => show(path), 420);
    });
    path.addEventListener("pointerup", () => window.clearTimeout(timer));
    path.addEventListener("pointerleave", () => window.clearTimeout(timer));
  }
};

const arcPath = (cx: number, cy: number, r: number, start: number, sweep: number) => {
  const safeSweep = Math.min(sweep, 359.999);
  const startPoint = polarPoint(cx, cy, r, start);
  const endPoint = polarPoint(cx, cy, r, start + safeSweep);
  const largeArc = safeSweep > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${startPoint.x} ${startPoint.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`,
    "Z"
  ].join(" ");
};

const polarPoint = (cx: number, cy: number, r: number, angleFromTop: number) => {
  const radians = (angleFromTop - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians)
  };
};

const escapeAttr = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
