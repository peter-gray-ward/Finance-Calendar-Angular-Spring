import {
	Directive,
	HostListener,
	HostBinding
} from '@angular/core';

@Directive({
  selector: "[applyfocus]",
  standalone: true
})
export class ApplyFocus {
  @HostBinding('class.focused') isFocused = false;

  @HostListener('focus') onFocus() {
    this.isFocused = true;
  }

  @HostListener('blur') onBlur() {
    this.isFocused = false;
  }
}