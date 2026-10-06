import type { SemesterFile } from './types';

export interface DecodedSchedule {
  semesterId: string;
  dataVersion: string;
  picks: Record<string, string>;
  isVersionMatch: boolean;
  unresolvedComponentIds: string[];
}

interface SerializedPayload {
  s: string; // semesterId
  v: string; // dataVersion
  p: Record<string, string>; // picks { componentId: sectionId }
}

export function toBase64Url(str: string): string {
  // Safe utf-8 base64 encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeSchedule(
  semesterId: string,
  dataVersion: string,
  picks: Record<string, string>
): string {
  const payload: SerializedPayload = {
    s: semesterId,
    v: dataVersion,
    p: picks,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeSchedule(
  hash: string,
  semester: SemesterFile
): DecodedSchedule {
  let parsed: SerializedPayload;
  try {
    const jsonStr = fromBase64Url(hash);
    parsed = JSON.parse(jsonStr) as SerializedPayload;
  } catch (_err) {
    throw new Error('Invalid schedule share code');
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.s || !parsed.p) {
    throw new Error('Malformed schedule share payload');
  }

  const validPicks: Record<string, string> = {};
  const unresolved: string[] = [];

  const availableSections = new Set(semester.sections.map((sec) => sec.id));
  const availableComponents = new Set(semester.components.map((c) => c.id));

  for (const [componentId, sectionId] of Object.entries(parsed.p)) {
    if (availableComponents.has(componentId) && availableSections.has(sectionId)) {
      // Verify that this section actually offers this component
      const sectionObj = semester.sections.find((s) => s.id === sectionId);
      const hasSlot = sectionObj?.slots.some((sl) => sl.componentId === componentId);
      if (hasSlot) {
        validPicks[componentId] = sectionId;
      } else {
        unresolved.push(componentId);
      }
    } else {
      unresolved.push(componentId);
    }
  }

  return {
    semesterId: parsed.s,
    dataVersion: parsed.v ?? '',
    picks: validPicks,
    isVersionMatch: parsed.v === semester.dataVersion,
    unresolvedComponentIds: unresolved,
  };
}
