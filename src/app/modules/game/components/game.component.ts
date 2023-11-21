import { Component, OnInit } from '@angular/core';
import { Piece } from '../../piece/helperClasses/Piece';
import { PiecePosition } from '../../piece/helperClasses/PiecePosition';
import { PieceColorEnum } from '../../piece/enum/PieceColorEnum';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  public INITIAL_FEN: string = '8/yyyyyyyy/yyyyyyyy/8/8/bbbbbbbb/bbbbbbbb/8';
  public board: Piece[][] = [];
  private _numYellow: number = 0;
  private _numBlack: number = 0;
  private _numShaikhYellow: number = 0;
  private _numShaikhBlack: number = 0;


  public ngOnInit() {
    this._parseFEN(this.INITIAL_FEN);
  }


  private _parseFEN(fen: string): void {
    this.board = Array.from({ length: 8 }, () =>
      Array(8).fill(new Piece(new PiecePosition(0, 0), PieceColorEnum.NONE, false))
    );

    let x: number = 0;
    let y: number = 0;

    for (const c of fen) {
      switch (c) {
        case 'y':
          this._numYellow++;
          this.board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.YELLOW, false);
          x++;
          break;
        case 'Y':
          this._numYellow++;
          this._numShaikhYellow++;
          this.board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.YELLOW, true);
          x++;
          break;
        case 'b':
          this._numBlack++;
          this.board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.BLACK, false);
          x++;
          break;
        case 'B':
          this._numBlack++;
          this._numShaikhBlack++;
          this.board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.BLACK, true);
          x++;
          break;
        case '/':
          y++;
          x = 0;
          break;
        default:
          let num: number = parseInt(c);
          x += isNaN(num) ? 0 : num;
          break;
      }
    }
  }
}
