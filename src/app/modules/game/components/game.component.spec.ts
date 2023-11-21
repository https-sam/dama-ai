import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { GameService } from '../services/game.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PieceColorEnum } from '../../piece/enum/PieceColorEnum';
import { Piece } from '../../piece/helperClasses/Piece';
import { PiecePosition } from '../../piece/helperClasses/PiecePosition';
import { PieceComponent } from '../../piece/components/piece.component';
import { gameConfig } from '../game-config';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let gameService: GameService;
  let piecesPositionsFENSubject: BehaviorSubject<string>;

  beforeEach(async () => {
    piecesPositionsFENSubject = new BehaviorSubject<string>('8/yyyyyyyy/yyyyyyyy/8/8/bbbbbbbb/bbbbbbbb/8');

    await TestBed.configureTestingModule({
      declarations: [ GameComponent, PieceComponent ],
      providers: [
        { provide: GameService, useValue: { piecesPositionsFEN$: piecesPositionsFENSubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    gameService = TestBed.inject(GameService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to piecesPositionsFEN$ and call _parseFEN', () => {
      spyOn(component as any, '_parseFEN');
      piecesPositionsFENSubject.next('8/8/8/8/8/8/8/8');
      expect((component as any)._parseFEN).toHaveBeenCalledWith('8/8/8/8/8/8/8/8');
    });
  });

  describe('_parseFEN', () => {
    it('should correctly parse the FEN string and update the board', () => {
      const testFEN = 'y7/8/8/8/8/8/8/B7';
      (component as any)._parseFEN(testFEN);

      expect(component.board[0][0]).toEqual(jasmine.any(Piece));
      expect(component.board[0][0].color).toEqual(PieceColorEnum.YELLOW);
      expect(component.board[7][0]).toEqual(jasmine.any(Piece));
      expect(component.board[7][0].color).toEqual(PieceColorEnum.BLACK);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from piecesPositionsFEN$ on component destruction', () => {
      const subscriptionSpy = spyOn(Subscription.prototype, 'unsubscribe').and.callThrough();

      component.ngOnDestroy();

      expect(subscriptionSpy).toHaveBeenCalled();
    });
  });
});
