import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User, Authentication } from '../../../models/User';
import { Sync } from '../../../models/Sync';
import { HttpService } from '../../../core/http.service';
import { DataService } from '../../../core/data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  user: Authentication = {
    name: '',
    password: ''
  };
  error?: string;
  message?: string;

  constructor(
    private http: HttpService,
    private data: DataService,
    private router: Router
  ) {}

  login() {
    this.http.login(this.user).subscribe(res => {
      switch (res.status) {
        case "success":
          this.message = `${this.user.name} successfully logged-in!`
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500)
          break;
        default:
          this.error = res.message
          break;
      }
    })
  }

  register() {
    console.log(this.user)
    this.http.register(this.user).subscribe(res => {
      console.log(res)
      if (res.status !== 'success') {
        this.error = res.message; 
      } else {
        this.message = `${this.user.name} successfully registered!`
      }
    })
  }
}
