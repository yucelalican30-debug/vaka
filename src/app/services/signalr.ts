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
        console.log('Device deleted via SignalR:', deviceId);
        this.deviceDeleted$.next(deviceId);
      });

      this.hubConnection.on('DeviceAdded', (device: any) => {
        console.log('Device added via SignalR:', device);
        this.deviceAdded$.next(device);
      });

      this.hubConnection.on('DeviceUpdated', (device: any) => {
        console.log('Device updated via SignalR:', device);
        this.deviceUpdated$.next(device);
      });

      this.hubConnection.start()
        .then(() => {
          this.isConnected = true;
          console.log('SignalR connected successfully');
        })
        .catch(err => {
          this.isConnected = false;
          console.warn('SignalR connection warning (hub endpoint may not be configured yet):', err.message);
          // Devam et, uygulama SignalR olmadan da çalışabilir
        });
    } catch (err) {
      console.error('Error initializing SignalR:', err);
      this.isConnected = false;
    }
  }

  public sendDeviceDeleted(deviceId: string) {
    if (this.isConnected && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyDeviceDeleted', deviceId)
        .catch(err => console.error('Error invoking NotifyDeviceDeleted:', err));
    }
  }

  public sendDeviceAdded(device: any) {
    if (this.isConnected && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyDeviceAdded', device)
        .catch(err => console.error('Error invoking NotifyDeviceAdded:', err));
    }
  }

  public sendDeviceUpdated(device: any) {
    if (this.isConnected && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyDeviceUpdated', device)
        .catch(err => console.error('Error invoking NotifyDeviceUpdated:', err));
    }
  }
}
