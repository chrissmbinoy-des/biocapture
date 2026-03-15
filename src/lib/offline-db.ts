import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PendingIdentification {
  id: string;
  imageData: string;
  coordinates: { latitude: number; longitude: number } | null;
  createdAt: string;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
}

interface OfflineDBSchema extends DBSchema {
  species: {
    key: string;
    value: any;
    indexes: { 'by-kingdom': string; 'by-date': string };
  };
  badges: {
    key: string;
    value: any;
  };
  userBadges: {
    key: string;
    value: any;
  };
  pendingIdentifications: {
    key: string;
    value: PendingIdentification;
    indexes: { 'by-status': string };
  };
  cacheMetadata: {
    key: string;
    value: { key: string; updatedAt: string };
  };
}

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>('critter-offline', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('species')) {
        const speciesStore = db.createObjectStore('species', { keyPath: 'id' });
        speciesStore.createIndex('by-kingdom', 'kingdom');
        speciesStore.createIndex('by-date', 'identified_at');
      }
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('userBadges')) {
        db.createObjectStore('userBadges', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingIdentifications')) {
        const pendingStore = db.createObjectStore('pendingIdentifications', { keyPath: 'id' });
        pendingStore.createIndex('by-status', 'status');
      }
      if (!db.objectStoreNames.contains('cacheMetadata')) {
        db.createObjectStore('cacheMetadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// --- Species cache ---
export async function cacheSpecies(species: any[]) {
  const db = await getDB();
  const tx = db.transaction('species', 'readwrite');
  await tx.store.clear();
  for (const s of species) {
    await tx.store.put(s);
  }
  await tx.done;
  await updateCacheTimestamp('species');
}

export async function getCachedSpecies(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('species');
}

// --- Badges cache ---
export async function cacheBadges(badges: any[]) {
  const db = await getDB();
  const tx = db.transaction('badges', 'readwrite');
  await tx.store.clear();
  for (const b of badges) {
    await tx.store.put(b);
  }
  await tx.done;
  await updateCacheTimestamp('badges');
}

export async function getCachedBadges(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('badges');
}

// --- User badges cache ---
export async function cacheUserBadges(userBadges: any[]) {
  const db = await getDB();
  const tx = db.transaction('userBadges', 'readwrite');
  await tx.store.clear();
  for (const ub of userBadges) {
    await tx.store.put(ub);
  }
  await tx.done;
  await updateCacheTimestamp('userBadges');
}

export async function getCachedUserBadges(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('userBadges');
}

// --- Pending identifications queue ---
export async function addPendingIdentification(imageData: string, coordinates: { latitude: number; longitude: number } | null): Promise<string> {
  const db = await getDB();
  const id = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.put('pendingIdentifications', {
    id,
    imageData,
    coordinates,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  });
  return id;
}

export async function getPendingIdentifications(): Promise<PendingIdentification[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingIdentifications', 'by-status', 'pending');
}

export async function getAllPendingIdentifications(): Promise<PendingIdentification[]> {
  const db = await getDB();
  return db.getAll('pendingIdentifications');
}

export async function updatePendingStatus(id: string, status: 'pending' | 'processing' | 'failed') {
  const db = await getDB();
  const item = await db.get('pendingIdentifications', id);
  if (item) {
    item.status = status;
    if (status === 'failed') item.retryCount += 1;
    await db.put('pendingIdentifications', item);
  }
}

export async function removePendingIdentification(id: string) {
  const db = await getDB();
  await db.delete('pendingIdentifications', id);
}

// --- Cache metadata ---
async function updateCacheTimestamp(key: string) {
  const db = await getDB();
  await db.put('cacheMetadata', { key, updatedAt: new Date().toISOString() });
}

export async function getCacheTimestamp(key: string): Promise<string | null> {
  const db = await getDB();
  const meta = await db.get('cacheMetadata', key);
  return meta?.updatedAt || null;
}

export type { PendingIdentification };
