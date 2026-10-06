export interface ExifData {
  make?: string;
  model?: string;
  orientation?: number;
  takenAt?: Date;
  fNumber?: number;
  exposureTime?: number;
  iso?: number;
  focalLength?: number;
}

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

const TAG_MAKE = 0x010f;
const TAG_MODEL = 0x0110;
const TAG_ORIENTATION = 0x0112;
const TAG_EXIF_IFD = 0x8769;
const TAG_EXPOSURE_TIME = 0x829a;
const TAG_F_NUMBER = 0x829d;
const TAG_ISO = 0x8827;
const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_OFFSET_TIME_ORIGINAL = 0x9011;
const TAG_FOCAL_LENGTH = 0x920a;

// a hostile file must not be able to make the reader loop or allocate without bound
const MAX_ENTRIES = 512;

const clean = (value: string | undefined) => {
  const text = value?.replace(/\0/g, "").trim();
  return text === "" ? undefined : text;
};

/** The offset of the TIFF header inside the EXIF block, which JPEG wraps in an "Exif\0\0" prefix and other formats do not. */
const findTiffHeader = (buffer: Buffer): number => {
  const little = buffer.indexOf(Buffer.from([0x49, 0x49, 0x2a, 0x00]));
  const big = buffer.indexOf(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]));

  if (little === -1) return big;
  if (big === -1) return little;
  return Math.min(little, big);
};

/**
 * Reads the handful of EXIF fields the photo viewer shows. Anything malformed is skipped rather than thrown,
 * a photo with broken metadata is still a photo.
 */
export function parseExif(buffer: Buffer): ExifData {
  const result: ExifData = {};
  const start = findTiffHeader(buffer);

  if (start === -1 || buffer.length < start + 8) return result;

  const view = new DataView(buffer.buffer, buffer.byteOffset + start, buffer.length - start);
  const littleEndian = view.getUint16(0) === 0x4949;
  const length = view.byteLength;

  const readValue = (entry: number): (number | string)[] | undefined => {
    const type = view.getUint16(entry + 2, littleEndian);
    const count = view.getUint32(entry + 4, littleEndian);
    const unit = TYPE_SIZES[type];

    if (unit === undefined || count > 4096) return undefined;

    const bytes = unit * count;
    const offset = bytes <= 4 ? entry + 8 : view.getUint32(entry + 8, littleEndian);

    if (offset + bytes > length) return undefined;

    if (type === 2) return [buffer.toString("latin1", start + offset, start + offset + bytes)];

    const values: number[] = [];

    for (let index = 0; index < count; index++) {
      const at = offset + index * unit;

      switch (type) {
        case 1:
        case 7:
          values.push(view.getUint8(at));
          break;
        case 3:
          values.push(view.getUint16(at, littleEndian));
          break;
        case 4:
          values.push(view.getUint32(at, littleEndian));
          break;
        case 9:
          values.push(view.getInt32(at, littleEndian));
          break;
        case 5: {
          const denominator = view.getUint32(at + 4, littleEndian);
          values.push(denominator === 0 ? Number.NaN : view.getUint32(at, littleEndian) / denominator);
          break;
        }
        case 10: {
          const denominator = view.getInt32(at + 4, littleEndian);
          values.push(denominator === 0 ? Number.NaN : view.getInt32(at, littleEndian) / denominator);
          break;
        }
      }
    }

    return values;
  };

  const number = (value: (number | string)[] | undefined) => {
    const first = value?.[0];
    return typeof first === "number" && Number.isFinite(first) ? first : undefined;
  };

  const text = (value: (number | string)[] | undefined) => (typeof value?.[0] === "string" ? clean(value[0]) : undefined);

  let takenText: string | undefined;
  let offsetText: string | undefined;

  const readIfd = (ifd: number, depth: number) => {
    if (ifd + 2 > length || depth > 2) return;

    const entries = Math.min(view.getUint16(ifd, littleEndian), MAX_ENTRIES);

    for (let index = 0; index < entries; index++) {
      const entry = ifd + 2 + index * 12;
      if (entry + 12 > length) return;

      const tag = view.getUint16(entry, littleEndian);

      try {
        switch (tag) {
          case TAG_MAKE:
            result.make = text(readValue(entry));
            break;
          case TAG_MODEL:
            result.model = text(readValue(entry));
            break;
          case TAG_ORIENTATION:
            result.orientation = number(readValue(entry));
            break;
          case TAG_EXPOSURE_TIME:
            result.exposureTime = number(readValue(entry));
            break;
          case TAG_F_NUMBER:
            result.fNumber = number(readValue(entry));
            break;
          case TAG_ISO:
            result.iso = number(readValue(entry));
            break;
          case TAG_FOCAL_LENGTH:
            result.focalLength = number(readValue(entry));
            break;
          case TAG_DATE_TIME_ORIGINAL:
            takenText = text(readValue(entry));
            break;
          case TAG_OFFSET_TIME_ORIGINAL:
            offsetText = text(readValue(entry));
            break;
          case TAG_EXIF_IFD: {
            const pointer = number(readValue(entry));
            if (pointer !== undefined) readIfd(pointer, depth + 1);
            break;
          }
        }
      } catch {
        // one unreadable tag does not invalidate the others
      }
    }
  };

  try {
    readIfd(view.getUint32(4, littleEndian), 0);
  } catch {
    return result;
  }

  const taken = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(takenText ?? "");

  if (taken) {
    const [, year, month, day, hour, minute, second] = taken.map(Number) as number[];
    const zone = /^([+-])(\d{2}):(\d{2})$/.exec(offsetText ?? "");

    // without an offset the camera's clock time is the best that is known, it is read as server local time
    const date = zone
      ? new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second!) - (zone[1] === "-" ? -1 : 1) * (Number(zone[2]) * 60 + Number(zone[3])) * 60_000)
      : new Date(year!, month! - 1, day!, hour!, minute!, second!);

    // cameras with an unset clock write zeroes, which is not a date worth sorting by
    if (!Number.isNaN(date.getTime()) && year! > 1970) result.takenAt = date;
  }

  return result;
}

/** "Canon EOS R5" from a make and model that often repeat each other ("Canon", "Canon EOS R5"). */
export function describeCamera(exif: ExifData): string | undefined {
  const { make, model } = exif;

  if (!make && !model) return undefined;
  if (!make) return model;
  if (!model) return make;

  return model.toLowerCase().startsWith(make.toLowerCase().split(" ")[0]!) ? model : `${make} ${model}`;
}

/** "f/1.8 · 1/250 s · ISO 50" */
export function describeExposure(exif: ExifData): string | undefined {
  const parts: string[] = [];

  if (exif.fNumber) parts.push(`f/${Number(exif.fNumber.toFixed(1))}`);

  if (exif.exposureTime) {
    parts.push(exif.exposureTime >= 1 ? `${Number(exif.exposureTime.toFixed(1))} s` : `1/${Math.round(1 / exif.exposureTime)} s`);
  }

  if (exif.iso) parts.push(`ISO ${exif.iso}`);

  return parts.length > 0 ? parts.join(" · ") : undefined;
}
