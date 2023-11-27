import {Component, Input} from '@angular/core';
import {PieceColorEnum} from '../enum/PieceColorEnum';
import {PiecePosition} from '../helperClasses/PiecePosition';
import {Piece} from '../helperClasses/Piece';


@Component({
  selector: 'app-piece',
  templateUrl: './piece.component.html',
  styleUrls: ['./piece.component.scss']
})
export class PieceComponent implements Piece {
  @Input() color: PieceColorEnum = PieceColorEnum.NONE;
  @Input() king: boolean = false;
  @Input() position: PiecePosition = new PiecePosition(0, 0);

  protected readonly PieceColorEnum = PieceColorEnum;

  public otherColor(): PieceColorEnum {
    return this.color === PieceColorEnum.YELLOW ? PieceColorEnum.BLACK : PieceColorEnum.YELLOW;
  }
}
// const nullPiece: PieceComponent = new PieceComponent(PieceColorEnum.NONE, PiecePosition.nullPos);
