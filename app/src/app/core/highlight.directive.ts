import {
	Directive,
	HostListener,
	HostBinding,
	ElementRef
} from '@angular/core';

@Directive({
	selector: "[highlight]",
	standalone: true
})
export class HighlightDirective {
	constructor(private el: ElementRef) {}

	@HostListener('mouseenter') onMouseEnter() {
		this.el.nativeElement.style.backgroundColor = 'yellow';
	}

	@HostListener('mouseleave') onMouseLeave() {
		this.el.nativeElement.style.backgroundColor = 'initial';
	}
}