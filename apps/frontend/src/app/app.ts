import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';
import { HamburgerMenu } from './components/hamburger-menu/hamburger-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Navbar, HamburgerMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Basic Rag');
  cartItemCount = 3; // Mock cart item count
  constructor() {}
}
