import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  isMenuOpen = signal(false);

  openMenu() {
    this.isMenuOpen.set(true);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  toggleMenu() {
    this.isMenuOpen.update((value) => !value);
  }
}
