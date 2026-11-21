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

export type AreaWithCurrentRent = z.infer<typeof areaWithCurrentRentSchema>;

// manifest 中的一个 Region：区域数量，以及当前租金和边界文件的地址。
export const manifestPartitionSchema = z
  .object({
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    areaCount: z.number().int().positive(),
    currentRentsUrl: nonEmptyStringSchema,
    geometryUrl: nonEmptyStringSchema,
  })
  .strict();

// 页面读取数据的入口：当前版本、生成时间、数据最新季度和全部 Region。
export const manifestSchema = z
  .object({
    version: nonEmptyStringSchema,
    generatedAt: z.iso.datetime(),
    latestPeriod: periodSchema,
    partitions: z.array(manifestPartitionSchema).min(1),
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
