import { Component, OnDestroy, OnInit } from '@angular/core';
import { Piece } from '../../piece/helperClasses/Piece';
import { PiecePosition } from '../../piece/helperClasses/PiecePosition';
import { PieceColorEnum } from '../../piece/enum/PieceColorEnum';
import { GameService } from '../services/game.service';
import { Observable, Subscription } from 'rxjs';
import { Move } from '../../piece/helperClasses/Move';
import { Board } from '../types/board';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  private _numYellow: number = 0;
  private _numBlack: number = 0;
  private _numShaikhYellow: number = 0;
  private _numShaikhBlack: number = 0;
  private _subscription: Subscription | undefined = undefined;

  public currentBoard: Board = null;
  public highlightedPieces: Move[] = [];
  public possiblePositions: Set<string> = new Set();



  constructor(
    private _gameService: GameService
  ) { }


  get board(): Observable<Board> {
    return this._gameService.board$;
  }

  public isPossibleMove(x: number, y: number): boolean {
    return this.possiblePositions.has(`${x},${y}`);
  }

  public ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }

  public ngOnInit(): void {
    this._subscription = this._gameService.piecesPositionsFEN$.subscribe((fen: string): void => {
      this._parseFEN(fen);
    });
    this._gameService.init();
  }

  public displayPossibleMoves(piece: Piece): void {
    this.highlightedPieces = this._gameService.getPossibleMovesOf(piece);
    let newPositions: Set<string> = new Set<string>();
    console.log(this.highlightedPieces)

    this.highlightedPieces.forEach((move: Move): void => {
      for (let i = 1; i < move.positions.length; i++) {
        const pos: PiecePosition = move.positions[i];
        newPositions.add(`${pos.x},${pos.y}`);
      }
    });

    // Assign a new set to trigger change detection
    console.log(newPositions)
    this.possiblePositions = newPositions;
  }



  public handleClick(piece: Piece, x: number, y: number): void {
    if (this.isPossibleMove(x, y)) {
      console.log("Branch true");
      const selectedMove = this.highlightedPieces.find(move =>
        move.positions.some(pos => pos.x === x && pos.y === y));

      if (selectedMove) {
        console.log(selectedMove);
        this._gameService.play(selectedMove); // Execute the move
        this.possiblePositions.clear();
      }
    } else {
      console.log("Branch false");
      this.displayPossibleMoves(piece); // Display possible moves for the selected piece
    }
  }



  private _parseFEN(fen: string): void {
    const board: Piece[][] = Array.from({ length: 8 }, () =>
      Array(8).fill(new Piece(new PiecePosition(0, 0), PieceColorEnum.NONE, false))
    );

    let x: number = 0;
    let y: number = 0;

    for (const c of fen) {
      switch (c) {
        case 'y':
          this._numYellow++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.YELLOW, false);
          x++;
          break;
        case 'Y':
          this._numYellow++;
          this._numShaikhYellow++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.YELLOW, true);
          x++;
          break;
        case 'b':
          this._numBlack++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.BLACK, false);
          x++;
          break;
        case 'B':
          this._numBlack++;
          this._numShaikhBlack++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.BLACK, true);
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

    this._gameService.updateBoard(board);
  }

}

