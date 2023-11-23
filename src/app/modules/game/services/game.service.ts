import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {gameConfig} from '../game-config';
import {Piece} from '../../piece/helperClasses/Piece';
import {Move} from '../../piece/helperClasses/Move';
import {PieceColorEnum} from '../../piece/enum/PieceColorEnum';
import {DirectionsEnum} from '../../piece/enum/DirectionsEnum';
import {PiecePosition} from '../../piece/helperClasses/PiecePosition';
import {Board} from '../types/board';


@Injectable({
  providedIn: 'root'
})
export class GameService {

  private _piecesPositionsFEN: BehaviorSubject<string> = new BehaviorSubject<string>(gameConfig.initialPiecesPositionsFEN);
  private _board: BehaviorSubject<Board> = new BehaviorSubject<Board>([]);
  private _turn: PieceColorEnum = PieceColorEnum.BLACK;
  private _directions: DirectionsEnum[] = [DirectionsEnum.NORTH, DirectionsEnum.EAST, DirectionsEnum.SOUTH, DirectionsEnum.WEST];
  private _boardBlocks: number[][][] = [];
  private _possible_moves: Move[] = [];
  private _moveCacheMap: Map<string, Move[]> = new Map<string, Move[]>();

  public piecesPositionsFEN$: Observable<string> = this._piecesPositionsFEN.asObservable();
  public board$: Observable<Board> = this._board.asObservable();


  constructor() {
    this._preComputeBoardBlocks();
  }

  public init(): void {
    this._possible_moves = this._generatePossibleMoves();

    for (const move of this._possible_moves) {
      const key: string = `${move.positions[0].x},${move.positions[0].y}`;
      if (!this._moveCacheMap.has(key)) this._moveCacheMap.set(key, []);
      this._moveCacheMap.set(key, [...this._moveCacheMap.get(key), move]);
    }
  }

  public play(move: Move): void {
    // const board: Board = [...this._board.value];
    const board: Board = JSON.parse(JSON.stringify(this._board.value));

    const OLD = board[move.positions[0].y][move.positions[0].x];

    const p: Piece = new Piece(move.positions[move.positions.length -1], OLD.color, OLD.king)

    board[move.positions[0].y][move.positions[0].x].color = PieceColorEnum.NONE;
    board[move.positions[0].y][move.positions[0].x].king = false;
    // board[move.positions[0].y][move.positions[0].x].position = new PiecePosition(-1, -1);

    for (const p of move.eaten) {
      if (p.color === PieceColorEnum.BLACK) {
        board[p.position.y][p.position.x].color = PieceColorEnum.NONE;
        board[p.position.y][p.position.x].king = false;
        // board[p.position.y][p.position.x].position = new PiecePosition(-1, -1);
      }
    }

    // p.position = move.positions[move.positions.length -1];

    // promotion
    if(!p.king && (p.position.y == 0 || p.position.y == 7)){ // might need to check color too
      p.king = true;
    }

    board[p.position.y][p.position.x] = p;

    const fenForThisTurn = this._generateFen(board);
    this.setPiecesPositionsFEN(fenForThisTurn);
    this.updateBoard(board);
    this.nextTurn();
  }

  public nextTurn(): void {
    this._moveCacheMap.clear();

    this._turn = this._turn === PieceColorEnum.BLACK ? PieceColorEnum.YELLOW : PieceColorEnum.BLACK;
    this._possible_moves = this._generatePossibleMoves();
    console.log(this._possible_moves);

    for (const move of this._possible_moves) {
      const key: string = `${move.positions[0].x},${move.positions[0].y}`;
      if (!this._moveCacheMap.has(key)) this._moveCacheMap.set(key, []);
      this._moveCacheMap.set(key, [...this._moveCacheMap.get(key), move]);
    }
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
      if(count != 0) line += `${count}`;
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


  private _generatePossibleMoves(): Move[] {
    let moves: Move[] = [];
    const board: Board = JSON.parse(JSON.stringify(this._board.value))

    for(const row of board){
      for(const p of row) {
        if(p.color === this._turn){
            const moves2: Move[] = p.king ? this._generatePossibleKingMoves(p, board) : this._generatePossiblePawnMoves(p, board);
            moves.push(...moves2);
        }
      }
    }

    const eating: boolean = moves.some((m: Move) => m.eat );

    if(eating){
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


  private _makeSingleMove(p: Piece, eaten: Piece, pos: PiecePosition): Board {
    // const board: Board = [...this._board.value];
    const board: Board = JSON.parse(JSON.stringify(this._board.value))

    const NEW_PIECE = new Piece(pos, p.color, p.king);

    board[eaten.position.y][eaten.position.x] = new Piece(new PiecePosition(-1, -1), PieceColorEnum.NONE, false);
    board[p.position.y][p.position.x] = new Piece(new PiecePosition(-1, -1), PieceColorEnum.NONE, false);
    board[pos.y][pos.x] = NEW_PIECE;
    // p.position = pos;

    return board;
  }


  private _generatePossiblePawnMoves(p: Piece, board: Board, eating: boolean = false): Move[] {
    const moves: Move[] = [];

    for (const direction of this._directions) {

      if (direction === DirectionsEnum.NORTH && p.color === PieceColorEnum.YELLOW) continue;
      if (direction === DirectionsEnum.SOUTH && p.color === PieceColorEnum.BLACK) continue;
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
      } else {
        const pos: PiecePosition | null = this._canPawnEat(p, board[y][x], board);

        if (pos != null) {

          const move: Move = new Move([p.position, pos], true);
          move.eaten.push(new Piece(board[y][x].position, board[y][x].color, board[y][x].king));

          const eaten: Piece = new Piece(board[y][x].position, board[y][x].color, board[y][x].king);

          const new_board: Board = this._makeSingleMove(p, eaten, pos);
          const moves2: Move[] = this._generatePossiblePawnMoves(p, new_board, true);
          // this._unmakeSingleMove(p, eaten, oldPos);


          // add the eaten piece to the move
          for (const m of moves2) {
            const m2: Move = move;

            for (let i: number = 1; i < m.positions.length; i++){
              m2.positions.push(m.positions[i]);
            }

            m2.eat = true;
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

        if ((directionIndex === DirectionsEnum.NORTH && p.position.y == 0) ||
          (directionIndex === DirectionsEnum.EAST && p.position.x == 7) ||
          (directionIndex === DirectionsEnum.SOUTH && p.position.y == 7) ||
          (directionIndex === DirectionsEnum.WEST && p.position.x == 0)) {
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

        if (board[y][x].color === PieceColorEnum.NONE && !eating) {
          moves.push(new Move([p.position, new PiecePosition(x, y)]));
        } else if(board[y][x].color != p.color) {
          if (x2 < 0 || x2 >= gameConfig.boardWidth || y2 < 0 || y2 >= gameConfig.boardHeight) continue;
          if (board[y2][x2].color != PieceColorEnum.NONE) continue;

          const positions: PiecePosition[] = this._canKingEat(p, board[y][x], board);

          for(const pos of positions){
            const oldPos: PiecePosition = p.position;
            const eaten: Piece = board[y][x];
            const move: Move = new Move([p.position, pos], true);

            move.eaten.push(eaten);

            const new_board = this._makeSingleMove(p, eaten, pos);
            const moves2: Move[] = this._generatePossibleKingMoves(p, new_board, true);

            // add the eaten piece to the move
            for(const m of moves2){
              const m2: Move = move;

              for(let i = 1; i < m.positions.length; ++i){
                m2.positions.push(m.positions[i]);
              }

              m2.eat = true;
              m2.eaten.push(...m.eaten);
              moves.push(m2);
            }

            moves.push(move);
          }
        }
        else break;
      }
    }
    return moves;
  }


  private _canPawnEat(p1: Piece, p2: Piece, board: Board): PiecePosition | null {
    if ((p2.position.x != p1.position.x && p2.position.y != p1.position.y) || p1.color === p2.color)
      return null;

    const result: number = p1.color === PieceColorEnum.YELLOW ? 1 : -1;

    // check if the distance between the two pieces is more than one square
    if ((p2.position.x === p1.position.x && p2.position.y - p1.position.y != result)
      || (p2.position.y === p1.position.y && Math.abs(p2.position.x - p1.position.x) != 1))
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
    if ((p2.position.x !== p1.position.x && p2.position.y !== p1.position.y) || p1.color === p2.color)
      return [];

    // check if this piece can jump over the other piece even if it is a long jump
    if(p2.position.x == p1.position.x){
      if(p2.position.y == 0 || p2.position.y == 7) return [];

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
        board[p2.position.y + (i*dir)][p2.position.x].color == PieceColorEnum.NONE
        && (p2.position.y + (i*dir)) >= 0
        && (p2.position.y + (i*dir)) < gameConfig.boardHeight
        ; ++i) {
          positions.push(new PiecePosition(p2.position.x, p2.position.y + (i * dir)));
      }
      return positions;
    } else { // if p2.position.y === p1.position.y

      if (p2.position.x === 0 || p2.position.x === 7) return [];
      const dist: number = Math.abs(p2.position.x - p1.position.x);
      const dir: number = p2.position.x - p1.position.x > 0 ? 1 : -1;

      if (this._board[p2.position.y][p2.position.x + dir].color !== PieceColorEnum.NONE) return [];

      for (let i = 1; i < dist; ++i) {
        if (board[p1.position.y][p1.position.x + i * dir].color !== PieceColorEnum.NONE){
          return [];
        }
      }

      const positions: PiecePosition[] = [];

      // for(int i = dist+1; board[p1.position.y][p1.position.x + (i * dir)].color == Piece::Color::None; ++i){
      for(let i = 1;
      board[p2.position.y][p2.position.x + (i*dir)].color == PieceColorEnum.NONE // taken from the other if
      && (p2.position.x + (i*dir)) >= 0
      && (p2.position.x + (i*dir)) < gameConfig.boardWidth;
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

}
