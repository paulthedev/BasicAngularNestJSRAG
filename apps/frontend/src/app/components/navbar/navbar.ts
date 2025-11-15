import { Component, inject, Input } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
  imports: [RouterModule],
})
export class Navbar {
  @Input() title = '';
  private menuService = inject(MenuService);
  constructor(
  ) {
    // The user service loads mock user data in its constructor
  }

  toggleMenu() {
    this.menuService.toggleMenu();
  }
}
