// 租金分段：地图填色、图例和列表中的颜色标记使用同一组阈值和颜色。
export const missingRentColour = "#94a3b8";

export const rentBands = [
  { label: "Under $400", colour: "#57c8b8", below: 400 },
  { label: "$400–under $600", colour: "#e6ad5c", below: 600 },
  { label: "$600 and over", colour: "#c45d55", below: Infinity },
];

// 一个租金对应的分段颜色；没有租金时使用缺失颜色。
export function getRentColour(medianRent: number | null): string {
  if (medianRent === null) {
    return missingRentColour;
  }

  return rentBands.find((band) => medianRent < band.below)?.colour ?? missingRentColour;
}
