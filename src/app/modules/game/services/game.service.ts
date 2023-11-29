import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { gameConfig } from '../game-config';
import { Piece } from '../../piece/helperClasses/Piece';
import { Move } from '../../piece/helperClasses/Move';
import { PieceColorEnum } from '../../piece/enum/PieceColorEnum';
import { DirectionsEnum } from '../../piece/enum/DirectionsEnum';
import { PiecePosition } from '../../piece/helperClasses/PiecePosition';
import { Board } from '../types/board';
import { FixedSizeCache } from "../../piece/helperClasses/FixedSizeHash";
import { ZobristHash } from "../../piece/helperClasses/ZobristHash";



@Injectable({
  providedIn: 'root'
})

export class GameService {

  private _piecesPositionsFEN: BehaviorSubject<string> = new BehaviorSubject<string>(gameConfig.initialPiecesPositionsFEN);
  private _board: BehaviorSubject<Board> = new BehaviorSubject<Board>([]);
  private _turn: PieceColorEnum = PieceColorEnum.BLACK;
  private _directions: DirectionsEnum[] = [DirectionsEnum.NORTH, DirectionsEnum.EAST, DirectionsEnum.SOUTH, DirectionsEnum.WEST];
  private _boardBlocks: number[][][] = [];
  private _moveCacheMap: Map<string, Move[]> = new Map<string, Move[]>();
  private _numYellow: number = 0;
  private _numBlack: number = 0;
  private _numShaikhYellow: number = 0;
  private _numShaikhBlack: number = 0;
  private _cacheHash: FixedSizeCache = new FixedSizeCache(1_000_000)
  private _hasher: ZobristHash = new ZobristHash();

  public possibleMoves: Move[] = [];
  public piecesPositionsFEN$: Observable<string> = this._piecesPositionsFEN.asObservable();
  public board$: Observable<Board> = this._board.asObservable();


  constructor() {
    this._preComputeBoardBlocks();
  }


  public get getNumYellow(): number {
    return this._numYellow;
  }

  public get getNumBlack(): number {
    return this._numBlack;
  }

  public get getNumYellowKing(): number {
    return this._numShaikhYellow;
  }

  public get getNumBlackKing(){
    return this._numShaikhBlack;
  }

  public set setNumBlack(n: number) {
    this._numBlack = n;
  }

  public set setNumYellow(n: number) {
    this._numYellow = n;
  }

  public set setNumBlackKing(n: number) {
    this._numShaikhBlack = n;
  }

  public set setNumYellowKing(n: number) {
    this._numShaikhYellow = n;
  }

  public getBoard(): Board {
    return this._board.value;
  }


  public init(): void {
    this.possibleMoves = this._generatePossibleMoves(this._board.value);

    for (const move of this.possibleMoves) {
      const key: string = `${move.positions[0].x},${move.positions[0].y}`;
      if (!this._moveCacheMap.has(key)) this._moveCacheMap.set(key, []);
      this._moveCacheMap.set(key, [...this._moveCacheMap.get(key), move]);
    }
  }

  public play(move: Move): void {
    const board: Board = JSON.parse(JSON.stringify(this._board.value));

    const oldPos: PiecePosition = new PiecePosition(move.positions[0].x, move.positions[0].y);
    const OLD: Piece = board[oldPos.y][oldPos.x];
    const newPos: PiecePosition = new PiecePosition(move.positions[move.positions.length -1].x, move.positions[move.positions.length -1].y);
    const p: Piece = new Piece(newPos, OLD.color, OLD.king)

    board[move.positions[0].y][move.positions[0].x].color = PieceColorEnum.NONE;
    board[move.positions[0].y][move.positions[0].x].king = false;
    board[move.positions[0].y][move.positions[0].x].position = new PiecePosition(-1, -1);

    for (const pi of move.eaten) {
      if (pi.color === PieceColorEnum.BLACK) {
        if(pi.king) --this._numShaikhBlack;
        --this._numBlack;
      } else {
        if(pi.king) --this._numShaikhYellow;
        --this._numYellow;
      }

      board[pi.position.y][pi.position.x].color = PieceColorEnum.NONE;
      board[pi.position.y][pi.position.x].king = false;
    }

    p.position = move.positions[move.positions.length -1];

    // promotion
    if (!p.king && (p.position.y === 0 || p.position.y === 7)) { // might need to check color too
      p.king = true;
    }

    board[p.position.y][p.position.x] = p;

    this._turn = p.otherColor();
    this.updateBoard(board);
    this.nextTurn();
  }

  public nextTurn(): void {
    this._moveCacheMap.clear();
    this.init();
  }

  private _generateFen(board: Board): string {
    let fen: string = "";
    for(const row of board){
      let count = 0;
      let line: string = "";
      for(const p of row){
        switch (p.color){
          case PieceColorEnum.NONE:
            ++count;
            break;
          case PieceColorEnum.YELLOW:
            if(count != 0) line += `${count}`;
            line += p.king ? "Y" : "y";
            count = 0;
            break;
          case PieceColorEnum.BLACK:
            if(count != 0) line += `${count}`;
            line += p.king ? "B" : "b";
            count = 0;
            break;
        }
      }
      if(count !== 0) line += `${count}`;
      fen += (line + "/");
      line = "";
    }
    return fen.substring(0, fen.length-2);
  }


  public setPiecesPositionsFEN(fen: string): void {
    this._piecesPositionsFEN.next(fen);
  }

  public updateBoard(board: Board): void {
    this._board.next(board);
  }


  private _generatePossibleMoves(board: Board): Move[] {
    let moves: Move[] = [];

    for (const row of this._board.value) {
      for (const p of row) {
        if (p.color === this._turn) {
            const moves2: Move[] = p.king ? this._generatePossibleKingMoves(p, board) : this._generatePossiblePawnMoves(p, board);
            moves.push(...moves2);
        }
      }
    }

    const eating: boolean = moves.some((m: Move) => m.eat );

    if (eating) {
      const max: number = moves.reduce(
        (acc: number, elt: Move): number => (elt && elt.positions.length > acc ? elt.positions.length : acc), 0);

      moves = moves.reduce(
        (acc: Move[], elt: Move) => (elt.positions.length === max && elt.eat ? (acc.push(elt), acc) : acc), []);
    }

    return moves;
  }


  private _preComputeBoardBlocks(): void {
    for (let i = 0; i < 8; ++i) {
      this._boardBlocks.push([]);
      for (let j = 0; j < 8; ++j) {
        this._boardBlocks[i].push([]);

        const num_north: number = i;
        const num_east: number = gameConfig.boardWidth - j - 1;
        const num_south: number = gameConfig.boardHeight - i - 1;
        const num_west: number = j;

        this._boardBlocks[i][j].push(num_north, num_east, num_south, num_west);
      }
    }
  }


  private _makeSingleMove(p: Piece, eaten: Piece, pos: PiecePosition, old_board: Board): { new_piece: Piece, new_board: Board } {
    const board: Board = JSON.parse(JSON.stringify(old_board))

    const NEW_PIECE: Piece = new Piece(new PiecePosition(pos.x, pos.y), p.color, p.king);

    board[eaten.position.y][eaten.position.x].color = PieceColorEnum.NONE;
    board[eaten.position.y][eaten.position.x].king = false;
    board[eaten.position.y][eaten.position.x].position.x = -1;
    board[eaten.position.y][eaten.position.x].position.y = -1;

    board[p.position.y][p.position.x].color = PieceColorEnum.NONE;
    board[p.position.y][p.position.x].king = false;
    board[p.position.y][p.position.x].position.x = -1;
    board[p.position.y][p.position.x].position.y = -1;

    board[pos.y][pos.x] = NEW_PIECE;

    return {
      new_piece: NEW_PIECE,
      new_board: board,
    };
  }

  private _generatePossiblePawnMoves(p: Piece, board: Board, eating: boolean = false): Move[] {
    const moves: Move[] = [];

    for (const direction of this._directions) {
      if (direction === DirectionsEnum.NORTH && (p.color === PieceColorEnum.YELLOW || p.position.y === 0)) continue;
      if (direction === DirectionsEnum.SOUTH && (p.color === PieceColorEnum.BLACK || p.position.y === 7)) continue;
      if (direction === DirectionsEnum.EAST && p.position.x === 7) continue;
      if (direction === DirectionsEnum.WEST && p.position.x === 0) continue;

      let x: number = p.position.x;
      let y: number = p.position.y;

      switch (direction) {
        case DirectionsEnum.NORTH:
          y -= 1;
          break;
        case DirectionsEnum.EAST:
          x += 1;
          break;
        case DirectionsEnum.SOUTH:
          y += 1;
          break;
        case DirectionsEnum.WEST:
          x -= 1;
          break;
      }

      if (board[y][x].color === PieceColorEnum.NONE && !eating) {
        moves.push(new Move([p.position, new PiecePosition(x, y)]))
      } else if(board[y][x].color != p.color){
        const pos: PiecePosition | null = this._canPawnEat(p, board[y][x], board);

        if (pos != null) {

          const move: Move = new Move([p.position, pos], true);
          move.eaten.push(board[y][x]);

          const eaten: Piece = board[y][x];

          const { new_piece, new_board } = this._makeSingleMove(p, eaten, pos, board);
          const moves2: Move[] = this._generatePossiblePawnMoves(new_piece, new_board, true);

          // add the eaten piece to the move
          for (const m of moves2) {
            const m2: Move = new Move(move.positions, true);
            m2.eaten.push(...move.eaten);

            for (let i: number = 1; i < m.positions.length; i++) {
              m2.positions.push(m.positions[i]);
            }

            m2.eaten.push(...m.eaten);

            moves.push(m2);
          }

          moves.push(move);
        }
      }
    }

    return moves;
  }


  private _generatePossibleKingMoves(p: Piece, board: Board, eating: boolean = false): Move[] {
    const moves: Move[] = [];

    for(const directionIndex of this._directions) {
      for (let num_square = 1; num_square <= this._boardBlocks[p.position.y][p.position.x][directionIndex]; ++num_square) {

        if ((directionIndex === DirectionsEnum.NORTH && p.position.y === 0) ||
          (directionIndex === DirectionsEnum.EAST && p.position.x === 7) ||
          (directionIndex === DirectionsEnum.SOUTH && p.position.y === 7) ||
          (directionIndex === DirectionsEnum.WEST && p.position.x === 0)) {
          continue;
        }

        let x :number = p.position.x;
        let y :number = p.position.y;
        let x2 :number = p.position.x;
        let y2 :number = p.position.y;

        switch(directionIndex) {
          case DirectionsEnum.NORTH:
            y -= num_square;
            y2 -= (num_square + 1);
            break;
          case DirectionsEnum.EAST:
            x += num_square;
            x2 += (num_square + 1);
            break;
          case DirectionsEnum.SOUTH:
            y += num_square;
            y2 += (num_square + 1);
            break;
          case DirectionsEnum.WEST:
            x -= num_square;
            x2 -= (num_square + 1);
            break;
        }

        if (!eating && board[y][x].color === PieceColorEnum.NONE) {
          moves.push(new Move([p.position, new PiecePosition(x, y)]));
        } else if(board[y][x].color !== p.color) {
          if (x2 < 0 || x2 >= gameConfig.boardWidth || y2 < 0 || y2 >= gameConfig.boardHeight) continue;
          if (board[y2][x2].color !== PieceColorEnum.NONE) continue;

          const positions: PiecePosition[] = this._canKingEat(p, board[y][x], board);

          for(const pos of positions){
            const eaten: Piece = board[y][x];
            const move: Move = new Move([p.position, pos], true);
            const { new_piece, new_board} = this._makeSingleMove(p, eaten, pos, board);
            const moves2: Move[] = this._generatePossibleKingMoves(new_piece, new_board, true);

            move.eaten.push(eaten);

            // add the eaten piece to the move
            for (const m of moves2) {
              const m2: Move = new Move([...move.positions], true);
              m2.eaten.push(...move.eaten);

              for(let i = 1; i < m.positions.length; ++i){
                m2.positions.push(m.positions[i]);
              }

              m2.eaten.push(...m.eaten);
              moves.push(m2);
            }

            moves.push(move);
          }
          break;
        }
        else break;
      }
    }
    return moves;
  }


  private _canPawnEat(p1: Piece, p2: Piece, board: Board): PiecePosition | null {
    if ((p2.position.x != p1.position.x && p2.position.y != p1.position.y) || (p1.color === p2.color) || p2.color === PieceColorEnum.NONE)
      return null;

    const result: number = p1.color === PieceColorEnum.YELLOW ? 1 : -1;

    // check if the distance between the two pieces is more than one square
    if ((p2.position.x === p1.position.x && p2.position.y - p1.position.y != result)
      || (p2.position.y === p1.position.y && Math.abs(p2.position.x - p1.position.x) !== 1))
      return null;


    // check if this can jump over the other
    if (p2.position.x === p1.position.x) {
      if (p2.position.y === 0 || p2.position.y === 7) return null;

      if (board[p2.position.y + result][p2.position.x].color === PieceColorEnum.NONE) {
        return new PiecePosition(p2.position.x, p2.position.y + result);
      }
    } else {
      // check both left and right
      if (p2.position.x === 0 || p2.position.x === 7) return null;

      if (board[p2.position.y][p2.position.x + 1].color === PieceColorEnum.NONE) { // right
        return new PiecePosition(p2.position.x + 1, p2.position.y);
      }

      if (board[p2.position.y][p2.position.x - 1].color === PieceColorEnum.NONE) { // left
        return new PiecePosition(p2.position.x - 1, p2.position.y);
      }
    }

    return null;
  }

  private _canKingEat(p1: Piece, p2: Piece, board: Board): PiecePosition[] {
    if ((p2.position.x !== p1.position.x && p2.position.y !== p1.position.y) || p1.color === p2.color || p2.color === PieceColorEnum.NONE)
      return [];

    // check if this piece can jump over the other piece even if it is a long jump
    if (p2.position.x === p1.position.x) {
      if (p2.position.y === 0 || p2.position.y === 7) return [];

      const dist: number = Math.abs(p2.position.y - p1.position.y);
      const dir: number = p2.position.y - p1.position.y > 0 ? 1 : -1;

      for(let i = 1; i < dist; ++i){
        if(board[p1.position.y + i * dir][p1.position.x].color != PieceColorEnum.NONE) {
          return [];
        }
      }

      if(board[p2.position.y + dir][p2.position.x].color != PieceColorEnum.NONE) return [];

      const positions: PiecePosition[] = [];

      for(let i = 1;
        (p2.position.y + (i*dir)) >= 0
        && (p2.position.y + (i*dir)) < gameConfig.boardHeight
        && board[p2.position.y + (i*dir)][p2.position.x].color === PieceColorEnum.NONE
        ; ++i) {
          positions.push(new PiecePosition(p2.position.x, p2.position.y + (i * dir)));
      }
      return positions;
    } else {
      const dist: number = Math.abs(p2.position.x - p1.position.x);
      const dir: number = p2.position.x - p1.position.x > 0 ? 1 : -1;

      if (p2.position.x + dir < 0 || p2.position.x + dir >= gameConfig.boardWidth) return [];

      if (board[p2.position.y][p2.position.x + dir].color !== PieceColorEnum.NONE) return [];

      for (let i = 1; i < dist; ++i) {
        if (board[p1.position.y][p1.position.x + i * dir].color !== PieceColorEnum.NONE){
          return [];
        }
      }

      const positions: PiecePosition[] = [];

      for(let i = 1;
      (p2.position.x + (i*dir)) >= 0
      && (p2.position.x + (i*dir)) < gameConfig.boardWidth
      && board[p2.position.y][p2.position.x + (i*dir)].color === PieceColorEnum.NONE; // taken from the other if
      ++i){
        positions.push(new PiecePosition(p2.position.x + (i*dir), p2.position.y));
      }

      return positions;
    }
  }

  public getPossibleMovesOf(p: Piece): Move[] {
    const key: string = `${p.position.x},${p.position.y}`;
    if(!this._moveCacheMap.has(key)) return [];
    return this._moveCacheMap.get(key);
  }


  private _countMaterial(color: PieceColorEnum, board: Board, endgame: boolean = false): number {
    let total: number = 0;

    if(endgame){
      // calculate the sum of the distances of every piece to the other pieces of opposite color
      for (const row of board) {
        for (const p of row) {
          if (p.color === color) {
          let sum: number = 0;
            for (const row2 of board) {
              for (const p2 of row2) {
                if (p2.color == p.otherColor()) {
                    sum += Math.abs(p.position.x - p2.position.x) + Math.abs(p.position.y - p2.position.y);
                    sum += Math.max(Math.abs(p.position.x - p2.position.x), Math.abs(p.position.y - p2.position.y));
                    // calculating the distance using the pythagorean theorem
                    sum += Math.sqrt(Math.pow(p.position.x - p2.position.x, 2) + Math.pow(p.position.y - p2.position.y, 2));
                  }
                }
            }
            total += sum;
          }
        }
      }

      if (color === PieceColorEnum.BLACK)
        return this._numShaikhBlack >= this._numShaikhYellow ? -total : total;
      else
        return this._numShaikhYellow >= this._numShaikhBlack ? -total : total;
    } else {
      const KING_VALUE: number = 100;
      const PAWN_ADVANCED_VALUE: number = 70;
      const PAWN_VALUE: number = 50;

      const respectivePawnBias = color === PieceColorEnum.BLACK ? // avoiding double check
        (p: Piece) => gameConfig.boardHeight - p.position.y +1 : (p: Piece) => p.position.y +1;

      const respectiveUpperHalf = color === PieceColorEnum.BLACK ? // avoiding double check
        (p: Piece) => p.position.y < 4 : (p: Piece) => p.position.y > 3;

      const respective_shaikh_bias: number = gameConfig.boardHeight + 2; // not a function since it doesn't depend on the piece

      for (const row of board) {
        for (const p of row) {
          if (p.color === color)  {
            if (p.king) total += (KING_VALUE + respective_shaikh_bias);
            else if (respectiveUpperHalf(p)) total += (PAWN_ADVANCED_VALUE + respectivePawnBias(p));
            else total += PAWN_VALUE + respectivePawnBias(p);
          }
        }
      }
    }

    return total;
  }



  private _evaluate(board: Board): number {
    const endgame: boolean = this._numBlack === this._numShaikhBlack && this._numYellow == this._numShaikhYellow;
    const blackMaterial: number = this._countMaterial(PieceColorEnum.BLACK, board, endgame);
    const yellowMaterial: number = this._countMaterial(PieceColorEnum.YELLOW, board, endgame);
    const perspective: number = this._turn === PieceColorEnum.BLACK ? 1 : -1;
    const material: number = blackMaterial - yellowMaterial;
    const evaluation: number = material / (this._numBlack + this._numYellow);

    return evaluation * perspective;
  }


  public makeMove(move: Move, old_board: Board): { promotion: boolean, new_board: Board } {
    let promotion: boolean = false;
    const board = JSON.parse(JSON.stringify(old_board));
    const pos: PiecePosition = move.positions[0];
    const p: Piece = new Piece(board[pos.y][pos.x].position, board[pos.y][pos.x].color, board[pos.y][pos.x].king);

    board[pos.y][pos.x].color = PieceColorEnum.NONE;

    for(const pi of move.eaten) {
      if (pi.color === PieceColorEnum.BLACK){
        if (pi.king) --this._numShaikhBlack;
        --this._numBlack;
      } else {
        if (pi.king) --this._numShaikhYellow;
        --this._numYellow;
      }

      board[pi.position.y][pi.position.x].color = PieceColorEnum.NONE;
      board[pi.position.y][pi.position.x].king = false;
    }

    p.position = move.positions[move.positions.length -1];

    // promotion
    if(!p.king && (p.position.y === 0 || p.position.y === 7)) {
      promotion = true;
      p.king = true;
      if(p.color === PieceColorEnum.BLACK) ++this._numShaikhBlack;
      else ++this._numShaikhYellow;
    }

    board[p.position.y][p.position.x] = p;

    this._turn = p.otherColor();

    return {promotion: promotion, new_board: board};
  }


  public unmakeMove(move: Move, promotion: boolean, board: Board): void {
    const pos: PiecePosition = move.positions[move.positions.length -1];
    const p: Piece = new Piece(board[pos.y][pos.x].position, board[pos.y][pos.x].color, board[pos.y][pos.x].king);

    for (const e of move.eaten) {
      if (e.color === PieceColorEnum.BLACK) {
        if(e.king) ++this._numShaikhBlack;
        ++this._numBlack;
      } else {
        if (e.king) ++this._numShaikhYellow;
        ++this._numYellow;
      }
    }

    if (promotion) {
      if(p.color === PieceColorEnum.BLACK) --this._numShaikhBlack;
      else --this._numShaikhYellow;
    }

    this._turn = this._turn === PieceColorEnum.BLACK ? PieceColorEnum.YELLOW : PieceColorEnum.BLACK;
  }


  public alphaBeta(depth: number = 10, board: Board, height: number = 0, alpha: number = -1000000, beta: number = 1000000): number {
    if (depth === 0) return this._evaluate(board);

    const hash: bigint = this._hasher.hash(board);
    const moves: Move[] = this._generatePossibleMoves(board);

    if (moves.length === 0) return -1000000;

    for (const m of moves) {
      const { promotion, new_board} = this.makeMove(m, board);
      const score: number = -this.alphaBeta(depth -1, new_board, height +1, -beta, -alpha);
      this.unmakeMove(m, promotion, new_board);

      if(score >= beta) return beta;
      if(score > alpha) alpha = score;
    }

    this._cacheHash.insert(hash, alpha, this._turn);

    return alpha;
  }

}
