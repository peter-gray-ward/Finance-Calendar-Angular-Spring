import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DataService } from './data.service';

export type ResizeStrategy = 'searchResults' | 'dayComponent';

@Injectable({
  providedIn: 'root',
})
export class ResizeService {
  private screenWidth = new BehaviorSubject<number>(window.innerWidth);
  screenWidth$ = this.screenWidth.asObservable();
  public resizeCallbacks: any[] = [
    () => {
      this.screenWidth.next(window.innerWidth);
      this.data.setActivity({ screenWidth: window.innerWidth });
    }
  ];

  constructor(private data: DataService) {
    fromEvent(window, 'resize')
      .pipe(debounceTime(0))
      .subscribe(() => {
        this.resizeCallbacks.forEach((callback: any) => callback());
      });
  }
}
