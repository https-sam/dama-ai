import { IsPossibleMovePipe } from './is-possible-move.pipe';

describe('IsPossibleMovePipe', () => {
  it('create an instance', () => {
    const pipe: IsPossibleMovePipe = new IsPossibleMovePipe();
    expect(pipe).toBeTruthy();
  });
});
