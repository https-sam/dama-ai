import {Piece} from "./Piece"
import {PieceColorEnum} from "../enum/PieceColorEnum";
import {Board} from "../../game/types/board";


export class ZobristHash{
    private table: Array<Array<Array<bigint>>> = new Array(8);


    private indexOf(p: Piece): number{
    let index: number = 0;
    if(p.king) index += 1;
    if(p.color === PieceColorEnum.BLACK) index += 2;

    return index;
  }


  constructor(){
    for (let i = 0; i < 8; ++i) {
      this.table[i] = new Array(8);
      for (let j = 0; j < 8; ++j) {
        this.table[i][j] = [
          BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
          BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
          BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
          BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
        ];
      }
    }
  }

  public hash(board: Board): bigint {
    let hash = BigInt(0);

    for (const row of board) {
      for (const p of row) {
        if (p.color !== PieceColorEnum.NONE) {
          hash ^= this.table[p.position.y][p.position.x][this.indexOf(p)];
        }
      }
    }

    return hash;
  }
}


