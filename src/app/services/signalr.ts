import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  public deviceDeleted$ = new Subject<string>();
  public deviceAdded$ = new Subject<any>();
  public deviceUpdated$ = new Subject<any>();
  public isConnected: boolean = false;

  constructor() {
    this.startConnection();
  }

  private startConnection() {
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('https://localhost:7054/deviceHub')
        .withAutomaticReconnect()
        .build();

      this.hubConnection.on('DeviceDeleted', (deviceId: string) => {
        console.log('Cihaz SignalR ile silindi:', deviceId);
        this.deviceDeleted$.next(deviceId);
      });

      this.hubConnection.on('DeviceAdded', (device: any) => {
        console.log('Cihaz SignalR ile eklendi:', device);
        this.deviceAdded$.next(device);
      });

      this.hubConnection.on('DeviceUpdated', (device: any) => {
        console.log('Cihaz SignalR ile güncellendi:', device);
        this.deviceUpdated$.next(device);
      });

      this.hubConnection.start()
        .then(() => {
          this.isConnected = true;
          console.log('SignalR başarıyla bağlandı');
        })
        .catch(err => {
          this.isConnected = false;
          console.warn('SignalR bağlantı uyarısı (hub endpoint henüz yapılandırılmamış olabilir):', err.message);
          // Devam et, uygulama SignalR olmadan da çalışabilir
        });
    } catch (err) {
      console.error('SignalR başlatılırken hata:', err);
      this.isConnected = false;
    }
  }

  public sendDeviceDeleted(deviceId: string) {
    if (this.isConnected && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyDeviceDeleted', deviceId)
        .catch(err => console.error('Cihaz silme bildirimi gönderilemedi:', err));
    }
  }

  public sendDeviceAdded(device: any) {
    if (this.isConnected && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyDeviceAdded', device)
        .catch(err => console.error('Cihaz ekleme bildirimi gönderilemedi:', err));
    }
  }

  public sendDeviceUpdated(device: any) {
    if (this.isConnected && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyDeviceUpdated', device)
        .catch(err => console.error('Cihaz güncelleme bildirimi gönderilemedi:', err));
    }
  }
}
