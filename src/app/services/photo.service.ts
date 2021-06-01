import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  //attenzione alle cose che importi, potrebbero entrare in conflitto e
  //dare errori e ci perderesti ore a cercare la soluzione.
  public photos: Photo[] = [];

  //metodo di acquisizione foto e salvataggio
  public async addNewToGallery() {
    //il metodo che fa la foto è getPhoto ed è insito nel plugin Capacitor Camera. Gira su ogni piattaforma
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    // this.photos.unshift({
    //   //src di salvataggio foto
    //   filepath: './photo-gallery-acquired',
    //   webviewPath: capturedPhoto.webPath
    // });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

  }
  //cameraPhoto: CameraPhoto <-- tipo CameraPhoto è datato, si usa Photo
  private async savePicture(cameraPhoto: Photo) {
    const base64Data = await this.readAsBase64(cameraPhoto);
    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath//potrebbe essere webviewPath?
    };
  }

  private async readAsBase64(cameraPhoto: Photo) {
    //fetch (acchiappa) la foto tramite blob (file generico) e la converte a 64bit
    // perchè la fotocamera è basata su quel formato
    const response = await fetch(cameraPhoto.webPath!); //potrebbe essere webviewPath?
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}
}
export interface Photo {
  filepath: string;
  webviewPath: string;
}


