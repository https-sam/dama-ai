import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isPossibleMovePipe'
})
export class IsPossibleMovePipe implements PipeTransform {
  transform(x: number, y: number, possiblePositions: Set<string>): boolean {
    return possiblePositions.has(`${x},${y}`);
  }
}
