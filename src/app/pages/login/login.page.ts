import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/classes/user';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {

  public cargaFin: boolean = false;
  public alertController: any;

  public arrayFirebase: Array<User> = [];
  public arrayTestUsers: Array<User> = [];
  public formLog: FormGroup;

  private subsDatabase: Subscription = Subscription.EMPTY;

  constructor(private alert: AlertService, private router: Router, private data: DatabaseService,
    private auth: AuthService, public formBuilder: FormBuilder) 
  {
    console.log("Entro en Login");
    this.formLog = this.formBuilder.group({
      email: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50), this.emailValidator, this.spaceValidator]],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(25), this.spaceValidator]]
    });
  }

  ngOnInit() {
    this.cleanInputs();
    
    this.subsDatabase = this.data.getCollectionObservable('usuarios').subscribe((next: any) => {
      let result: Array<any> = next;
      this.arrayFirebase = [];
      this.arrayTestUsers = [];

      result.forEach((obj: any) => {
        this.arrayFirebase.push(new User(obj.id, obj.correo, obj.clave, obj.perfil, obj.sexo, obj.nombre));
        
        this.cargaFin = true;
      });
      
      this.arrayFirebase.forEach(user => {
        if (user.id == 1 || user.id == 2 || user.id == 3) {
          this.arrayTestUsers.push(user);
        }

        this.cargaFin = true;
        console.log("Carga Fin");
      });
    });
  }

  ngOnDestroy(): void {
    this.subsDatabase.unsubscribe();
  }

  async iniciarSesion() {
    let tmpUser: User = User.initialize();

    if (this.formLog.valid) {
      this.alertaEspera();

      let formValues = this.formLog.value;
    
      this.arrayFirebase.forEach(usuario => {
        if (usuario.correo == formValues.email && usuario.clave == formValues.password) {
          tmpUser = usuario;
          return;
        }
      });
      await this.auth.logIn(tmpUser.correo, tmpUser.clave).then(res => {
        console.log("Usuario valido");

        this.auth.loggedUser = tmpUser;
        this.auth.email = res!.user.email || '';
        this.auth.perfil = tmpUser.perfil;
        this.auth.id = tmpUser.id;
        this.auth.nombre = tmpUser.nombre;
        this.auth.sexo = tmpUser.sexo;

        setTimeout(() => {
          
          Swal.close(this.alertController);
          this.alert.successToast("Sesión iniciada correctamente");
          this.cleanInputs();
          this.router.navigateByUrl('/home');
        }, 1500);
      })
      .catch(err => {
        console.error(err);

        if (Swal.isVisible()) {
          setTimeout(() => {
            
            this.auth.logOut();
            this.alert.sweetAlert('Error', 'No fue posible iniciar sesión, compruebe los datos ingresados', 'error');
            this.cleanInputs();
          }, 1000);
        }
      });
    } else {
      this.alert.sweetAlert('Error', 'Debe llenar los campos para iniciar sesión', 'error');
    }
  }

  fastLogin(email: string, clave: number) {
    this.formLog.controls['email'].setValue(email);
    this.formLog.controls['password'].setValue(clave);
  }

  cleanInputs() {
    this.formLog.reset({email: '', password: ''});
  }

  async alertaEspera() {
    this.alertController = await this.alert.waitAlert('Iniciando Sesión', 'Por favor espere...');
  }

  //#region custom validators
  private emailValidator(control : AbstractControl) : null | object
  { 
    const value = <string>control.value;
    const arroba = value.includes('@');

    if(!arroba)
    {
      return { formatoInvalido: true };
    }
    else
    {
      return null;
    }
  }

  private spaceValidator(control : AbstractControl) : null | object
  { 
    const value = <string>control.value.toString();
    const espacios = value.includes(' ');
    
    if(espacios)
    {
      return { contieneEspacios: true };
    }
    else
    {
      return null;
    }
  }
  //#endregion
}
