import { PieceColorEnum } from "../enum/PieceColorEnum";

class FixedSizeCache {
  private table: Map<bigint, Hashed> = new Map();
  private keys: Array<bigint> = [];
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  insert(key: bigint, value: number, turn: PieceColorEnum): void {
    if (this.table.size >= this.maxSize) {
      const oldestKey = this.keys.shift();
      if (oldestKey) {
        this.table.delete(oldestKey);
      }
    }

    if (this.table.has(key)) {
      this.table.set(key, { score: value, turn });

      const index = this.keys.indexOf(key);
      if (index !== -1) {
        this.keys.splice(index, 1);
      }
      this.keys.push(key);

      return;
    }

    this.table.set(key, { score: value, turn });
    this.keys.push(key);
  }

  contains(key: bigint): boolean {
    return this.table.has(key);
  }

  get(key: bigint): Hashed {
    return this.table.get(key)!;
  }

  size(): number {
    return this.table.size;
  }

  capacity(): number {
    return this.maxSize;
  }
}

interface Hashed {
  score: number;
  turn: PieceColorEnum;
}

export { FixedSizeCache };
