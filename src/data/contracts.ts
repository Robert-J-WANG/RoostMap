import { z } from "zod";

// 名称和上级地理编号都不能是空字符串。
const nonEmptyStringSchema = z.string().min(1);

// 缺失租金保留为 null；存在的租金不能小于 0。
const nullableRentSchema = z.number().nonnegative().nullable();

// Reported Bonds 是计数，存在时必须是非负整数。
const nullableBondCountSchema = z.number().int().nonnegative().nullable();

// SA2 2019 code 是所有数据文件共用的六位业务标识。
export const sa2IdSchema = z.string().regex(/^\d{6}$/);

export const rentalAreaSchema = z
  .object({
    sa2Id: sa2IdSchema,
    name: nonEmptyStringSchema,
    regionCode: nonEmptyStringSchema,
    regionName: nonEmptyStringSchema,
    territorialAuthorityCode: nonEmptyStringSchema,
    territorialAuthorityName: nonEmptyStringSchema,
  })
  .strict();

// MBIE 季度使用季度首日表示，只接受 1、4、7、10 月。
export const periodSchema = z.string().regex(/^\d{4}-(01|04|07|10)-01$/);

// 发布的住宅类型，直接使用 MBIE 源值。
export const dwellingTypeSchema = z.enum([
  "ALL",
  "Apartment",
  "Boarding House",
  "Flat",
  "House",
  "Room",
]);

// 发布的卧室分类；其他源值不进入浏览器数据。
export const bedroomCategorySchema = z.enum(["ALL", "1", "2", "3", "4", "5+"]);

export const rentalObservationSchema = z
  .object({
    period: periodSchema,
    sa2Id: sa2IdSchema,
    dwellingType: dwellingTypeSchema,
    bedrooms: bedroomCategorySchema,
    reportedBonds: nullableBondCountSchema,
    medianRent: nullableRentSchema,
    geometricMeanRent: nullableRentSchema,
  })
  .strict();

export const areaMetricSliceSchema = z
  .object({
    dwellingType: dwellingTypeSchema,
    bedrooms: bedroomCategorySchema,
    datasetLatestPeriod: periodSchema,
    observationPeriod: periodSchema.nullable(),
    medianRent: nullableRentSchema,
    geometricMeanRent: nullableRentSchema,
    reportedBonds: nullableBondCountSchema,
    yearOverYearChange: z.number().nullable(),
  })
  .strict();

export const areaSummarySchema = rentalAreaSchema.extend({
  metricSlices: z.array(areaMetricSliceSchema).min(1),
});

export type RentalArea = z.infer<typeof rentalAreaSchema>;
export type RentalObservation = z.infer<typeof rentalObservationSchema>;
export type AreaMetricSlice = z.infer<typeof areaMetricSliceSchema>;
export type AreaSummary = z.infer<typeof areaSummarySchema>;
