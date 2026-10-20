import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

/**
 * Embedded Postgres must only be opened by one process at a time — two
 * servers on the same data folder corrupt it. A `<dataDir>.lock` file holds
 * the owner's pid; a lock left by a process that is no longer running is
 * taken over.
 */

const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
};

const ownerOf = (file: string): number | null => {
  if (!existsSync(file)) return null;
  const pid = Number(readFileSync(file, 'utf8').trim());
  return Number.isInteger(pid) && pid > 0 && pid !== process.pid && isAlive(pid) ? pid : null;
};

/** Returns a release function. Waits briefly for a previous owner to exit (e.g. `tsx watch` restarts). */
export const AcquireDataDirLock = async (dataDir: string, waitMs = 5000): Promise<() => void> => {
  const file = `${dataDir}.lock`;
  const deadline = Date.now() + waitMs;
  let owner = ownerOf(file);
  while (owner && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
    owner = ownerOf(file);
  }
  if (owner) {
    throw new Error(
      `Another StockMotion server (pid ${owner}) is using ${dataDir}. Stop it first, or set PGLITE_DIR to a different folder.`,
    );
  }
  writeFileSync(file, String(process.pid));

  const release = () => {
    try {
      if (readFileSync(file, 'utf8').trim() === String(process.pid)) unlinkSync(file);
    } catch {
      /* already gone */
    }
  };
  process.once('exit', release);
  return release;
};
