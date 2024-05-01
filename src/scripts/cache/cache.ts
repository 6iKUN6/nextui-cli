import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs';

import {getLatestVersion} from '../helpers';
import {CACHE_DIR, CACHE_PATH} from '../path';

const cacheTTL = 30 * 60_000; // 30min

export interface CacheData {
  [packageName: string]: {
    version: string;
    date: Date;
    expiredDate: number;
  };
}

export function initCache() {
  const isExistCache = existsSync(CACHE_DIR);

  if (isExistCache) return;

  mkdirSync(CACHE_DIR, {recursive: true});
  writeFileSync(CACHE_PATH, JSON.stringify({}), 'utf8');
}

export function getCacheData(): CacheData {
  const data = readFileSync(CACHE_PATH, 'utf8');

  return JSON.parse(data);
}

/**
 * Used to cache unknown npm package expired time 30m
 * @packageName string
 */
export function cacheData(
  packageName: string,
  packageData: {
    version: string;
  },
  cacheData?: CacheData
) {
  initCache();

  const data = cacheData ?? getCacheData();

  data[packageName] = {
    ...packageData,
    date: new Date(),
    expiredDate: +new Date() + cacheTTL
  };

  writeFileSync(CACHE_PATH, JSON.stringify(data), 'utf-8');
}

export function removeCache() {
  unlinkSync(CACHE_DIR);
}

function now() {
  return +new Date();
}

function ttl(n: number) {
  return now() - n;
}

function isExpired(packageName: string, cacheData?: CacheData) {
  const data = cacheData ?? getCacheData();
  const pkgData = data[packageName];

  if (!pkgData?.expiredDate) return true;

  if (ttl(pkgData.expiredDate) < cacheTTL) {
    return true;
  }

  return false;
}

export async function getPackageData(packageName: string) {
  const data = getCacheData();
  const isExpiredPkg = isExpired(packageName, data);

  if (isExpiredPkg) {
    const version = await getLatestVersion(packageName);

    data[packageName] = {
      date: new Date(),
      expiredDate: +new Date() + cacheTTL,
      version
    };

    writeFileSync(CACHE_PATH, JSON.stringify(data), 'utf8');
  }

  return data[packageName];
}