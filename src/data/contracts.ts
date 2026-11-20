import { z } from "zod";

// 名称和上级地理编号都不能是空字符串。
const nonEmptyStringSchema = z.string().min(1);

// 一个 SA2 的区域信息：编号、名称，以及所属 Region 和 territorial authority。
export const areaSchema = z
  .object({
    sa2Id: z.string().regex(/^\d{6}$/),
    name: nonEmptyStringSchema,
    regionCode: nonEmptyStringSchema,
    regionName: nonEmptyStringSchema,
    territorialAuthorityCode: nonEmptyStringSchema,
    territorialAuthorityName: nonEmptyStringSchema,
  })
  .strict();

// MBIE（租金） 季度使用季度首日表示，只接受 1、4、7、10 月。
const periodSchema = z.string().regex(/^\d{4}-(01|04|07|10)-01$/);

// 一个 SA2 在 ALL / ALL 分类下的当前租金和 12 个月变化。
export const currentRentSchema = z
  .object({
    datasetLatestPeriod: periodSchema,
    observationPeriod: periodSchema.nullable(),
    medianRent: z.number().nonnegative().nullable(),
    reportedBonds: z.number().int().nonnegative().nullable(),
    yearOverYearChange: z.number().nullable(),
  })
  .strict();

// 区域列表中的一行：区域信息加上当前租金。
export const areaWithCurrentRentSchema = areaSchema.extend({
  currentRent: currentRentSchema,
});
