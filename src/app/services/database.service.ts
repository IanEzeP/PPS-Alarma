import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, first } from 'rxjs';
import { User } from '../classes/user';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  usuariosBD: Array<User> = [];

  constructor(private firestore: AngularFirestore) { }

  cargarUsuarios() {
    console.log("Utilizo servicio Database");
    this.getCollectionObservable("usuarios").subscribe((next : any) =>  {
      let result : Array<any>  = next;
      this.usuariosBD = [];
      
      result.forEach((obj : any) => {
        this.usuariosBD.push(new User(obj.id, obj.correo, obj.clave, obj.perfil, obj.sexo, obj.nombre));
      });
    });
    console.log("Finalizo inicializacion");
  }

  obtenerUsuarioPorEmail(email: string) : Promise<any|null> {
    const usrPromise = this.firestore.collection('usuarios', ref => ref.where('correo', '==', email)).snapshotChanges()
    .pipe(
      map(actions => {
        if (actions.length === 0) {
          return null; // No encontró usuario
        }
        
        const data = actions[0].payload.doc.data() as any;
        const id = actions[0].payload.doc.id;
        return { id, ...data }; // Retorna el primer usuario encontrado
        }),
      first()
    )
    .toPromise()
    .catch(error => {
      console.error('Error retrieving from usuarios:', error);
      return null;
    });

    console.log("Comprobamos si usrPromise encontro usuario: " + usrPromise);

    return usrPromise;
  }

  traerUnDocumento(coleccion: string, id: string) {
    return this.firestore.firestore.doc(coleccion + '/' + id).get();
  }

  traerDocumentoObservable(coleccion: string, id: string) {
    return this.firestore.doc(coleccion + '/' + id).get();
  }

  getCollectionObservable(coleccion: string) {
    return this.firestore.collection(coleccion).valueChanges();
  }
  
  getCollectionSnapshot(coleccion: string) {
    return this.firestore.collection(coleccion).snapshotChanges();
  }

  getCollectionPromise(coleccion: string) {
    return this.firestore.firestore.collection(coleccion).get();
  }
}
