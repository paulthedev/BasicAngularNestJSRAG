import { Component, computed, inject, Input } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hamburger-menu',
  templateUrl: './hamburger-menu.html',
  styleUrls: ['./hamburger-menu.scss'],
  imports: [RouterLink],
})
export class HamburgerMenu {
  private menuService = inject(MenuService);
  protected isMenuOpen = computed(() => this.menuService.isMenuOpen());
  @Input() title = '';

  constructor() {}

  closeMenu() {
    this.menuService.closeMenu();
  }
}
