import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/User';
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
  user: User = {
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
    this.http.login(this.user).subscribe(authorization => {
      switch (authorization.authenticated) {
        case true:
          this.router.navigate(['/']);
          break;
        default:
          this.error = authorization.error;
          break;
      }
    })
  }

  register() {
    console.log(this.user)
    this.http.register(this.user).subscribe(res => {
      if (res.error) {
        this.error = res.error; 
      } else {
        this.message = `${this.user.name} successfully registered!`
      }
    })
  }
}
