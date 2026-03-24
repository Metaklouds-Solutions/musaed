function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bytesToHex(bytes: number[]): string | null {
  if (bytes.length === 0 || bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
    return null;
  }
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readBufferHex(value: Record<string, unknown>): string | null {
  if (Array.isArray(value.data)) {
    return bytesToHex(value.data as number[]);
  }
  if (isRecord(value.buffer) && Array.isArray(value.buffer.data)) {
    return bytesToHex(value.buffer.data as number[]);
  }
  return null;
}

export function normalizeEntityId(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (!isRecord(value)) {
    return null;
  }

  for (const key of ['_id', 'id', '$oid', 'oid']) {
    if (key in value) {
      const nested = normalizeEntityId(value[key]);
      if (nested) return nested;
    }
  }

  if (typeof value.toHexString === 'function') {
    const hex = normalizeEntityId(value.toHexString());
    if (hex) return hex;
  }

  const bufferHex = readBufferHex(value);
  if (bufferHex) {
    return bufferHex;
  }

  if (typeof value.toString === 'function') {
    const stringified = value.toString().trim();
    if (stringified && stringified !== '[object Object]') {
      return stringified;
    }
  }

  return null;
}
