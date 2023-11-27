import { PieceColorEnum } from '../enum/PieceColorEnum';
import { PiecePosition } from './PiecePosition';

export class Piece {
  public color: PieceColorEnum = PieceColorEnum.NONE;
  public king: boolean = false;
  public position: PiecePosition = new PiecePosition(0, 0);

  constructor(position: PiecePosition, color: PieceColorEnum, king: boolean = false) {
    this.color = color;
    this.king = king;
    this.position = position;
  }

  public otherColor(): PieceColorEnum {
    return this.color === PieceColorEnum.YELLOW ? PieceColorEnum.BLACK : PieceColorEnum.YELLOW;
  }

}
