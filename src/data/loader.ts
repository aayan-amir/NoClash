import { ManifestSchema, SemesterFileSchema } from '../core/schema';
import type { Manifest, SemesterFile } from '../core/types';
import { cache } from './cache';

const MANIFEST_CACHE_KEY = 'loom:v1:manifest';
const SEMESTER_CACHE_PREFIX = 'loom:v1:data:';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface CachedRecord<T> {
  data: T;
  dataVersion?: string;
  fetchedAt: number;
}

export interface ManifestLoadResult {
  manifest: Manifest;
  usingSavedData: boolean;
}

export interface SemesterLoadResult {
  semester: SemesterFile;
  usingSavedData: boolean;
  updatedFromRemote: boolean;
}

export async function fetchManifest(forceRefresh = false): Promise<ManifestLoadResult> {
  const cached = cache.get<CachedRecord<Manifest>>(MANIFEST_CACHE_KEY);
  const now = Date.now();

  // If cache is fresh and not force-refresh, return immediately
  if (cached && !forceRefresh && now - cached.fetchedAt < TWENTY_FOUR_HOURS_MS) {
    return {
      manifest: cached.data,
      usingSavedData: true,
    };
  }

  try {
    const res = await fetch('/data/manifest.json', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch manifest: HTTP ${res.status}`);
    }
    const json: unknown = await res.json();
    const manifest = ManifestSchema.parse(json);

    cache.set<CachedRecord<Manifest>>(MANIFEST_CACHE_KEY, {
      data: manifest,
      fetchedAt: now,
    });

    return {
      manifest,
      usingSavedData: false,
    };
  } catch (err) {
    if (cached) {
      return {
        manifest: cached.data,
        usingSavedData: true,
      };
    }
    throw new Error(
      `Could not load timetable directory: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function fetchSemester(
  semesterId: string,
  fileUrl: string,
  forceRefresh = false
): Promise<SemesterLoadResult> {
  const cacheKey = `${SEMESTER_CACHE_PREFIX}${semesterId}`;
  const cached = cache.get<CachedRecord<SemesterFile>>(cacheKey);

  // If cached and not forced, return cached version right away
  if (cached && !forceRefresh) {
    return {
      semester: cached.data,
      usingSavedData: true,
      updatedFromRemote: false,
    };
  }

  try {
    const res = await fetch(fileUrl, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch timetable: HTTP ${res.status}`);
    }
    const json: unknown = await res.json();
    const semester = SemesterFileSchema.parse(json);

    const isUpdated = Boolean(cached && cached.dataVersion !== semester.dataVersion);

    cache.set<CachedRecord<SemesterFile>>(cacheKey, {
      data: semester,
      dataVersion: semester.dataVersion,
      fetchedAt: Date.now(),
    });

    return {
      semester,
      usingSavedData: false,
      updatedFromRemote: isUpdated,
    };
  } catch (err) {
    if (cached) {
      return {
        semester: cached.data,
        usingSavedData: true,
        updatedFromRemote: false,
      };
    }
    throw new Error(
      `Could not load timetable data for semester ${semesterId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
