import { PiecePosition } from './PiecePosition';
import { Piece } from './Piece';

export class Move {
  public positions: PiecePosition[] = [];
  public eaten: Piece[] = [];
  public eat: boolean = false;

  // public guess: number; // for later

  constructor(positions: PiecePosition[], eats: boolean = false) {
    this.positions = [...positions];
    this.eat = eats;
  }

}
