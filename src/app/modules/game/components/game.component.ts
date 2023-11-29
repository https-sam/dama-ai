import { Component, OnDestroy, OnInit } from '@angular/core';
import { Piece } from '../../piece/helperClasses/Piece';
import { PiecePosition } from '../../piece/helperClasses/PiecePosition';
import { PieceColorEnum } from '../../piece/enum/PieceColorEnum';
import { GameService } from '../services/game.service';
import { Observable, Subscription } from 'rxjs';
import { Move } from '../../piece/helperClasses/Move';
import { Board } from '../types/board';
import { gameConfig } from "../game-config";


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  private _subscription: Subscription | undefined = undefined;

  public highlightedPieces: Move[] = [];
  public possiblePositions: Set<string> = new Set();


  constructor(
    private _gameService: GameService
  ) {}


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

    this.highlightedPieces.forEach((move: Move): void => {
      for (let i = 1; i < move.positions.length; i++) {
        const pos: PiecePosition = move.positions[i];
        newPositions.add(`${pos.x},${pos.y}`);
      }
    });

    this.possiblePositions = newPositions;
  }


  public handleClick(piece: Piece, x: number, y: number): void {
    if (this.isPossibleMove(x, y)) {
      const selectedMove: Move = this.highlightedPieces.find((move: Move) =>
        move.positions.some(pos => pos.x === x && pos.y === y));

      if (selectedMove) {
        this._gameService.play(selectedMove); // Execute the move
        this.possiblePositions.clear();

        if (this._gameService.getNumBlack === 0) {
          alert("Yellow has won the game!");
          this._parseFEN(gameConfig.initialPiecesPositionsFEN);
        } else if (this._gameService.getNumYellow === 0) {
          alert("Black has won the game!");
          this._parseFEN(gameConfig.initialPiecesPositionsFEN);
        } else {
          // AI turn:
          const moves: Move[] = this._gameService.possibleMoves;
          let best: number = -1000000;
          let bestMove: Move = moves[0];

          if (moves.length > 1) {
            for (const m of moves) {
              const { promotion, new_board } = this._gameService.makeMove(m, this._gameService.getBoard());
              const score: number = this._gameService.alphaBeta(4, new_board);
              this._gameService.unmakeMove(m, promotion, new_board);

              if (score >= best) {
                best = score;
                bestMove = m;
              }
            }
          }

          this._gameService.play(bestMove);
          this.possiblePositions.clear();
        }
      }
    } else {
      this.displayPossibleMoves(piece); // Display possible moves for the selected piece
    }
  }


  private _parseFEN(fen: string): void {
    const board: Piece[][] = Array.from({ length: 8 }, () =>
      Array(8).fill(new Piece(new PiecePosition(0, 0), PieceColorEnum.NONE, false))
    );

    let x: number = 0;
    let y: number = 0;

    let numYellow: number = 0;
    let numBlack: number = 0;
    let numYellowKing: number = 0;
    let numBlackKing: number = 0;

    for (const c of fen) {
      switch (c) {
        case 'y':
          numYellow++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.YELLOW, false);
          x++;
          break;
        case 'Y':
          numYellow++;
          numYellowKing++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.YELLOW, true);
          x++;
          break;
        case 'b':
          numBlack++;
          board[y][x] = new Piece(new PiecePosition(x, y), PieceColorEnum.BLACK, false);
          x++;
          break;
        case 'B':
          numBlack++;
          numBlackKing++;
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

      this._gameService.setNumBlack = numBlack;
      this._gameService.setNumYellow = numYellow;
      this._gameService.setNumBlackKing = numBlackKing;
      this._gameService.setNumYellowKing = numYellowKing;
    }

    this._gameService.updateBoard(board);
  }

}
