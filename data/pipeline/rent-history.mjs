import {
  convertToQuarterlyRent,
  isPublishedCategory,
  sortQuarterlyRents,
} from "./current-rents.mjs";

/**
 * 生成一个 Region 的租金历史：以 SA2 编号为键，值是这个 SA2 在发布分类下的全部季度租金记录。
 * 与当前租金使用同一组 SA2 和同一套分类规则，所以历史与当前租金可以一一对应。
 *
 * @param {object} input
 * @param {string[]} input.sa2Ids 这个 Region 的可发布 SA2 编号
 * @param {Record<string, string>[]} input.mbieRecords MBIE（租金） 记录，可以包含其他 Region 和所有分类
 * @returns {Record<string, object[]>} 租金历史，形状符合 contracts.ts 中的 regionRentHistorySchema；
 *   每个 SA2 的记录按分类、再按季度从旧到新排列
 */
export function buildRegionRentHistory({ sa2Ids, mbieRecords }) {
  // 先为每个可发布 SA2 准备空列表，只读一遍 MBIE（租金） 记录。
  const quarterlyRentsBySa2Id = new Map(sa2Ids.map((sa2Id) => [sa2Id, []]));

  for (const record of mbieRecords) {
    const quarterlyRents = quarterlyRentsBySa2Id.get(record["Location Id"]);

    // 不是这个 Region 的可发布 SA2，或者不是发布的分类，都跳过。
    if (!quarterlyRents || !isPublishedCategory(record)) {
      continue;
    }

    quarterlyRents.push(convertToQuarterlyRent(record));
  }

  const regionRentHistory = {};
  for (const [sa2Id, quarterlyRents] of quarterlyRentsBySa2Id) {
    regionRentHistory[sa2Id] = sortQuarterlyRents(quarterlyRents);
  }

  return regionRentHistory;
}
