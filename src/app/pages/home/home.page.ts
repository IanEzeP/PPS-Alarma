import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion/ngx';
import { Flashlight } from '@ionic-native/flashlight/ngx';
import { Vibration } from '@ionic-native/vibration/ngx';
import { Subscription } from 'rxjs';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  subscription: Subscription = Subscription.EMPTY;

  primerIngreso = true;
  primerIngresoFlash = true;

  posicionActualCelular = 'actual';
  posicionAnteriorCelular = 'anterior';

  mostrarDialog = true;
  alarmOnOff = false;
  showDialog = false;
  estado = '';
  clave = '';

  accelerationX: any;
  accelerationY: any;
  accelerationZ: any;

  audioIzquierda = '../../assets/audios/todosladrones.mp3';
  audioDerecha = '../../assets/audios/soltame.mp3';
  audioVertical = '../../assets/audios/dejameenmilugar.mp3';
  audioHorizontal = '../../assets/audios/alerta.mp3';
  audioError = '../../assets/audios/contraseniamal.mp3';

  audioSource = new Audio();

  constructor(private auth: AuthService, private router: Router, public screenOrientation: ScreenOrientation, 
    public deviceMotion: DeviceMotion, private vibration: Vibration, private flashlight: Flashlight) {}

  ngOnInit(): void {}

  cambiarAlarma() {
    if (this.alarmOnOff === true) {
      this.checkPassword();
    }
    else {
      this.alarmOnOff = true;
      this.comenzar();
    }
  }

  parar() {
    this.mostrarDialog = true;
    this.primerIngreso = true;
    this.subscription.unsubscribe();
  }

  comenzar() {
    this.subscription = this.deviceMotion.watchAcceleration({ frequency: 300 }).subscribe((acceleration: DeviceMotionAccelerationData) => {
      this.accelerationX = Math.floor(acceleration.x);
      this.accelerationY = Math.floor(acceleration.y);
      this.accelerationZ = Math.floor(acceleration.z);
      //console.log(`Acelerómetro: X: ${this.accelerationX} Y: ${this.accelerationY} Z: ${this.accelerationZ}`);

      if (acceleration.x > 5) {
        //lado izquierdo
        this.posicionActualCelular = 'izquierda';
        this.movimientoIzquierda();
      }
      else if (acceleration.x < -5) {
        //lado derecho

        this.posicionActualCelular = 'derecha';
        this.movimientoDerecha();
      }
      else if (acceleration.y >= 9) {
        //parado encender flash por 5 segundos y sonido
        this.posicionActualCelular = 'arriba';
        
        if ((this.posicionActualCelular !== this.posicionAnteriorCelular)) {
          this.audioSource.src = this.audioVertical;
          this.posicionAnteriorCelular = 'arriba';
        }
        this.audioSource.play();
        this.movimientoVertical();
      }

      else if (acceleration.z >= 9 && (acceleration.y >= -1 && acceleration.y <= 1) && (acceleration.x >= -1 && acceleration.x <= 1)) {
        //acostado vibrar por 5 segundos y sonido
        this.posicionActualCelular = 'plano';
        this.movimientoHorizontal();
      }
    });
  }

  movimientoIzquierda() {
    this.primerIngreso = false;
    this.primerIngresoFlash = true;
    if (this.posicionActualCelular !== this.posicionAnteriorCelular) {
      this.posicionAnteriorCelular = 'izquierda';
      this.audioSource.src = this.audioIzquierda;
    }
    this.audioSource.play();
  }

  movimientoDerecha() {
    this.primerIngreso = false;
    this.primerIngresoFlash = true;
    if (this.posicionActualCelular !== this.posicionAnteriorCelular) {
      this.posicionAnteriorCelular = 'derecha';
      this.audioSource.src = this.audioDerecha;
    }
    this.audioSource.play();
  }

  movimientoVertical() {
    if (this.primerIngresoFlash) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.primerIngresoFlash ? this.flashlight.switchOn() : null;
      setTimeout(() => {
        this.primerIngresoFlash = false;
        this.flashlight.switchOff();
      }, 5000);
      this.primerIngreso = false;
    }
  }

  movimientoHorizontal() {
    if (this.posicionActualCelular !== this.posicionAnteriorCelular) {
      this.posicionAnteriorCelular = 'plano';
      this.audioSource.src = this.audioHorizontal;
    }
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.primerIngreso ? null : this.audioSource.play();
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.primerIngreso ? null : this.vibration.vibrate(5000);
    this.primerIngreso = true;
    this.primerIngresoFlash = true;
  }

  errorApagado() {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    // this.primerIngresoFlash ? this.flashlight.switchOn() : null;
    this.flashlight.switchOn();
    this.audioSource.src = this.audioError;
    this.audioSource.play();
    this.vibration.vibrate(5000);
    setTimeout(() => {
    this.primerIngresoFlash = false;
    this.flashlight.switchOff();
    this.vibration.vibrate(0);
    }, 5000);
  }

  async checkPassword() {
    const { value: password } = await Swal.fire({
      title: 'Ingrese la clave',
      input: 'password',
      icon: 'warning',
      inputLabel: '',
      inputPlaceholder: 'Ingresa la clave',
      heightAuto: false
    });

    this.clave = password;

    if (this.clave === this.auth.loggedUser.clave.toString()) {//Comparacion de usuario registrado con la clave ingresada recientemente
      console.log('ENTRE');
      this.estado = 'permitido';
      this.alarmOnOff = false;
      this.estado = '';
      this.clave = '';
      this.audioSource.pause();
      this.parar(); ///Paro la subscripcion al acceleration
    }
    else if (this.clave !== '') {
      console.log('Error contrasenia');
      this.estado = 'denegado';
      this.errorApagado();
      setTimeout(() => {
        this.estado = '';
      }, 1000);

    }
    //Tambien hay que agregar la funcionalidad del login y demas.
  }


  cerrarSesion() {
    Swal.fire({
      heightAuto: false,
      title: '¿Cerrar Sesión?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.logOut().then(() => this.router.navigateByUrl('/login'));
      }
    });
  }
}
