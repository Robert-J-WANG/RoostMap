import { z } from "zod";

// 名称和上级地理编号都不能是空字符串。
const nonEmptyStringSchema = z.string().min(1);

// SA2 编号是六位数字文本。
const sa2IdSchema = z.string().regex(/^\d{6}$/);

// 一个 SA2 的区域信息：编号、名称，以及所属 Region 和 territorial authority。
export const areaSchema = z
  .object({
    sa2Id: sa2IdSchema,
    name: nonEmptyStringSchema,
    regionCode: nonEmptyStringSchema,
    regionName: nonEmptyStringSchema,
    territorialAuthorityCode: nonEmptyStringSchema,
    territorialAuthorityName: nonEmptyStringSchema,
  })
  .strict();

export type Area = z.infer<typeof areaSchema>;

// MBIE（租金） 季度使用季度首日表示，只接受 1、4、7、10 月。
const periodSchema = z.string().regex(/^\d{4}-(01|04|07|10)-01$/);

// 发布的住宅类型和卧室数，与流水线中的发布列表相同。
const dwellingTypeSchema = z.enum(["ALL", "Apartment", "Boarding House", "Flat", "House", "Room"]);
const bedroomsSchema = z.enum(["ALL", "1", "2", "3", "4", "5+"]);

// 筛选控件的选项直接使用同一组发布分类。
export const dwellingTypes = dwellingTypeSchema.options;
export const bedroomCategories = bedroomsSchema.options;

export type DwellingType = z.infer<typeof dwellingTypeSchema>;
export type Bedrooms = z.infer<typeof bedroomsSchema>;

// 一个 SA2 在一种住宅类型和卧室数下的当前租金和 12 个月变化。
export const currentRentSchema = z
  .object({
    dwellingType: dwellingTypeSchema,
    bedrooms: bedroomsSchema,
    datasetLatestPeriod: periodSchema,
    observationPeriod: periodSchema.nullable(),
    medianRent: z.number().nonnegative().nullable(),
    reportedBonds: z.number().int().nonnegative().nullable(),
    yearOverYearChange: z.number().nullable(),
  })
  .strict();

export type CurrentRent = z.infer<typeof currentRentSchema>;

// 区域列表中的一行：区域信息加上它在各分类下的当前租金；至少有一个分类。
export const areaWithCurrentRentsSchema = areaSchema.extend({
  currentRents: z.array(currentRentSchema).min(1),
});

export type AreaWithCurrentRents = z.infer<typeof areaWithCurrentRentsSchema>;

// 一个 SA2 在一个季度、一种住宅类型和卧室数下的租金记录。
const quarterlyRentSchema = z
  .object({
    dwellingType: dwellingTypeSchema,
    bedrooms: bedroomsSchema,
    period: periodSchema,
    reportedBonds: z.number().int().nonnegative().nullable(),
    medianRent: z.number().nonnegative().nullable(),
    geometricMeanRent: z.number().nonnegative().nullable(),
  })
  .strict();

// 一个 Region 的租金历史：以 SA2 编号为键，值是这个 SA2 的季度租金记录。
export const regionRentHistorySchema = z.record(sa2IdSchema, z.array(quarterlyRentSchema));

export type RegionRentHistory = z.infer<typeof regionRentHistorySchema>;

// manifest 中的一个 Region：区域数量，以及当前租金、边界和租金历史文件的地址。
export const manifestPartitionSchema = z
  .object({
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    areaCount: z.number().int().positive(),
    currentRentsUrl: nonEmptyStringSchema,
    geometryUrl: nonEmptyStringSchema,
    rentHistoryUrl: nonEmptyStringSchema,
  })
  .strict();

// manifest 中的一个数据来源：名称、官方地址和许可证用来注明来源；
// 下载日期和源文件的 SHA-256 说明这份 release 由哪个源文件生成。
// 地址会显示为链接，因此只接受 https 地址。
const manifestSourceSchema = z
  .object({
    id: z.enum(["mbie-rental", "stats-sa2-2019"]),
    name: nonEmptyStringSchema,
    url: z.url({ protocol: /^https$/ }),
    licence: nonEmptyStringSchema,
    retrievedAt: z.iso.date(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

// 页面读取数据的入口：当前版本、生成时间、数据最新季度、全部 Region，
// 以及租金数据的状态、状态说明和数据来源。
export const manifestSchema = z
  .object({
    version: nonEmptyStringSchema,
    generatedAt: z.iso.datetime(),
    latestPeriod: periodSchema,
    partitions: z.array(manifestPartitionSchema).min(1),
    rentalDataStatus: z.enum(["provisional", "final"]),
    rentalDataNotice: nonEmptyStringSchema.nullable(),
    sources: z.array(manifestSourceSchema).min(1),
  })
  .strict();

export type ManifestPartition = z.infer<typeof manifestPartitionSchema>;
export type DataManifest = z.infer<typeof manifestSchema>;

// GeoJSON 坐标：一个点是经度和纬度，一个环是点的数组。
const positionSchema = z.tuple([z.number(), z.number()]);
const linearRingSchema = z.array(positionSchema);

// SA2 边界只能是 Polygon（环的数组）或 MultiPolygon（Polygon 的数组）。
const sa2GeometrySchema = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("Polygon"), coordinates: z.array(linearRingSchema) })
    .strict(),
  z
    .object({
      type: z.literal("MultiPolygon"),
      coordinates: z.array(z.array(linearRingSchema)),
    })
    .strict(),
]);

// 一个 Region 的边界文件：每个 feature 的 id 就是 SA2 编号，用来与当前租金连接。
export const regionGeometrySchema = z
  .object({
    type: z.literal("FeatureCollection"),
    features: z.array(
      z
        .object({
          type: z.literal("Feature"),
          id: sa2IdSchema,
          geometry: sa2GeometrySchema,
          properties: z.object({ sa2Id: sa2IdSchema }).strict(),
        })
        .strict(),
    ),
  })
  .strict();

export type RegionGeometry = z.infer<typeof regionGeometrySchema>;
