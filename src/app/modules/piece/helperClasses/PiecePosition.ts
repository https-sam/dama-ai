export class PiecePosition {
  public x: number;
  public y: number;
  public static nullPos: PiecePosition = new PiecePosition(-1, -1);

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
