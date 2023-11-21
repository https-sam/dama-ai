import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('piecesPositionsFEN$', () => {
    it('should initially emit default FEN string', (done) => {
      service.piecesPositionsFEN$.subscribe((fen) => {
        expect(fen).toBe('8/yyyyyyyy/yyyyyyyy/8/8/bbbbbbbb/bbbbbbbb/8');
        done();
      });
    });

    it('should emit new FEN string when setPiecesPositionsFEN is called', (done) => {
      const newFEN = '8/8/8/8/8/8/8/8';
      service.setPiecesPositionsFEN(newFEN);
      service.piecesPositionsFEN$.subscribe((fen) => {
        expect(fen).toBe(newFEN);
        done();
      });
    });
  });

  describe('setPiecesPositionsFEN', () => {
    it('should set a new FEN string', (done) => {
      const newFEN = '8/8/8/8/8/8/8/8';
      service.setPiecesPositionsFEN(newFEN);
      service.piecesPositionsFEN$.subscribe((fen) => {
        expect(fen).toBe(newFEN);
        done();
      });
    });
  });
});
