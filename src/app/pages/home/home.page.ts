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

  constructor(private auth: AuthService, private router: Router, public screenOrientation: ScreenOrientation, 
    public deviceMotion: DeviceMotion, private vibration: Vibration, private flashlight: Flashlight) {}

  ngOnInit(): void {}

  cambiarAlarma() {
    if (this.alarmOnOff === true) {
      //this.checkPassword();
      this.alarmOnOff = false;
    }
    else {
      this.alarmOnOff = true;
      this.comenzar();
    }
  }

  comenzar() {
    this.subscription = this.deviceMotion.watchAcceleration({ frequency: 300 }).subscribe((acceleration: DeviceMotionAccelerationData) => {
      this.accelerationX = Math.floor(acceleration.x);
      this.accelerationY = Math.floor(acceleration.y);
      this.accelerationZ = Math.floor(acceleration.z);

      console.log(`Acelerómetro: X: ${this.accelerationX} Y: ${this.accelerationY} Z: ${this.accelerationZ}`);

      if (acceleration.x > 5) {
        //Inclinacion Izquierda
        this.posicionActualCelular = 'izquierda';
      }
      else if (acceleration.x < -5) {
        //Inclinacion Derecha

        this.posicionActualCelular = 'derecha';
        //this.movimientoDerecha();
      }
      else if (acceleration.y >= 9) {
        //encender flash por 5 segundos y sonido
        this.posicionActualCelular = 'arriba';
        /*
        if ((this.posicionActualCelular !== this.posicionAnteriorCelular)) {
          this.audio.src = this.audioVertical;
          this.posicionAnteriorCelular = 'arriba';
        }
        this.audio.play();
        this.movimientoVertical();*/
      }

      else if (acceleration.z >= 9 && (acceleration.y >= -1 && acceleration.y <= 1) && (acceleration.x >= -1 && acceleration.x <= 1)) {
        //acostado vibrar por 5 segundos y sonido
        this.posicionActualCelular = 'plano';
        //this.movimientoHorizontal();
      }

      console.log(this.posicionActualCelular);

    });
  }

  cerraSesion() {
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
