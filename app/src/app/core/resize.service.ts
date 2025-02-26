import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export type ResizeStrategy = 'searchResults' | 'dayComponent';

@Injectable({
  providedIn: 'root',
})
export class ResizeService {
  private screenWidth = new BehaviorSubject<number>(window.innerWidth);
  screenWidth$ = this.screenWidth.asObservable();

  constructor() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(0))
      .subscribe(() => {
        this.screenWidth.next(window.innerWidth);
      });
  }
}
