import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})

export class PhotoService
{
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";
  constructor(private platform: Platform) {};
  public async loadSaved()
  {
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || []

    if (!this.platform.is('hybrid'))
    {
      for (let photo of this.photos)
      {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async addNewToGallery()
  {
    //il metodo che fa la foto è getPhoto ed è insito nel plugin Capacitor Camera. Gira su ogni piattaforma
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    Storage.set(
    {
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }
  //cameraPhoto: CameraPhoto <-- tipo CameraPhoto è datato, si usa Photo
  private async savePicture(cameraPhoto: Photo)
  {
    const base64Data = await this.readAsBase64(cameraPhoto);
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid'))
    {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    }
    else
    {
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.filepath,
      };
    }
  }

  private async readAsBase64(cameraPhoto: Photo)
  {
    if (this.platform.is('hybrid'))
    {
      const file = await Filesystem.readFile({
        path: cameraPhoto.filepath,
      });
      return file.data;
    }
    else
    {
      const response = await fetch(cameraPhoto.filepath!);
      const blob = await response.blob();
      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

  public async deletePicture(photo: Photo, position: number)
  {
    this.photos.splice(position, 1);

    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  }

  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
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





