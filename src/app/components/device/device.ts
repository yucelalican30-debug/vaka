import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DeviceModel } from '../../models/device.model';
import { GenericService } from '../../services/generic';
import { SignalRService } from '../../services/signalr';
import { SearchPipe } from '../../pipes/search-pipe';
import { MonthNamePipe } from '../../pipes/month-name';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [SearchPipe, MonthNamePipe, CommonModule, FormsModule],
  templateUrl: './device.html',
  styleUrl: './device.css',
})
export class Device implements OnInit, OnDestroy {
  devices: DeviceModel[] = [];
  search: string = '';

  constructor(private genericService: GenericService, private cdr: ChangeDetectorRef, private signalRService: SignalRService) {}

  ngOnInit() {
    this.getDevices();
    this.setupSignalRListeners();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  setupSignalRListeners() {
    // Başka bir user tarafından cihaz silindiğinde
    this.signalRService.deviceDeleted$.subscribe((deviceId: string) => {
      const device = this.devices.find(d => d.id === deviceId);
      if (device) {
        this.devices = this.devices.filter(d => d.id !== deviceId);
        this.cdr.markForCheck();
        Swal.fire('Bilgi', `${device.name} cihazı başka bir kullanıcı tarafından silindi.`, 'info');
      }
    });

    // Başka bir user tarafından cihaz eklendiğinde
    this.signalRService.deviceAdded$.subscribe((device: DeviceModel) => {
      this.devices.push(device);
      this.cdr.markForCheck();
      Swal.fire('Bilgi', `${device.name} cihazı başka bir kullanıcı tarafından eklendi.`, 'info');
    });

    // Başka bir user tarafından cihaz güncellendiğinde
    this.signalRService.deviceUpdated$.subscribe((updatedDevice: DeviceModel) => {
      const index = this.devices.findIndex(d => d.id === updatedDevice.id);
      if (index !== -1) {
        this.devices[index] = updatedDevice;
        this.cdr.markForCheck();
        Swal.fire('Bilgi', `${updatedDevice.name} cihazı başka bir kullanıcı tarafından güncellendi.`, 'info');
      }
    });
  }

  getDevices() {
    this.genericService.post<DeviceModel[]>('/api/Devices/GetAll', {}, (res) => {
      console.log('Response:', res);
      console.log('isSuccessful:', res.isSuccessful);
      console.log('data:', res.data);
      if (res.isSuccessful && res.data) {
        this.devices = res.data;
        this.cdr.markForCheck();
        console.log('Devices assigned:', this.devices);
      }
    });
  }

  updateDevice(device: DeviceModel) {
    Swal.fire({
      title: 'Cihazı Güncelle',
      text: `${device.name} cihazını güncellemek istediğinize emin misiniz?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Güncelle',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.genericService.post('/api/Devices/Update', device, (res) => {
          if (res.isSuccessful) {
            Swal.fire('Başarılı!', 'Cihaz güncellendi.', 'success');
            // SignalR üzerinden bildir
            this.signalRService.sendDeviceUpdated(device);
          } else {
            Swal.fire('Hata!', 'Cihaz güncellenirken hata oluştu.', 'error');
          }
        }, (err) => {
          console.error('Update error:', err);
          Swal.fire('Hata!', 'İşlem başarısız oldu.', 'error');
        });
      }
    });
  }

  addDevice() {
    Swal.fire({
      title: 'Yeni Cihaz Ekle',
      html: `
        <div style="text-align: left;">
          <label style="display: block; margin-bottom: 10px;">
            <span style="font-weight: bold;">Ad:</span><br/>
            <input id="swal-name" type="text" class="swal2-input" placeholder="Cihaz adı">
          </label>
          <label style="display: block; margin-bottom: 10px;">
            <span style="font-weight: bold;">Seri No:</span><br/>
            <input id="swal-serial" type="text" class="swal2-input" placeholder="Seri numarası">
          </label>
          <label style="display: block;">
            <input id="swal-active" type="checkbox">
            <span style="margin-left: 5px;">Aktif</span>
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ekle',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value;
        const serialNumber = (document.getElementById('swal-serial') as HTMLInputElement)?.value;
        const isActive = (document.getElementById('swal-active') as HTMLInputElement)?.checked;

        if (!name || !serialNumber) {
          Swal.showValidationMessage('Lütfen tüm alanları doldurun');
          return false;
        }

        return { name, serialNumber, isActive };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newDevice = {
          id: '',
          name: result.value.name,
          serialNumber: result.value.serialNumber,
          isActive: result.value.isActive,
          lastMaintenanceDate: new Date().toISOString(),
          isDeleted: false
        };

        this.genericService.post('/api/Devices/Create', newDevice, (res) => {
          if (res.isSuccessful && res.data) {
            Swal.fire('Başarılı!', 'Cihaz başarıyla eklendi.', 'success');
            this.devices.push(res.data);
            this.cdr.markForCheck();
            // SignalR üzerinden bildir
            this.signalRService.sendDeviceAdded(res.data);
          } else {
            Swal.fire('Hata!', 'Cihaz eklenirken hata oluştu.', 'error');
          }
        }, (err) => {
          console.error('Add error:', err);
          Swal.fire('Hata!', 'İşlem başarısız oldu.', 'error');
        });
      }
    });
  }

  deleteDevice(id: string) {
    const device = this.devices.find(d => d.id === id);
    Swal.fire({
      title: 'Cihazı Sil',
      text: `${device?.name} cihazını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Silme isteği gönderiliyor, ID:', id);
        this.genericService.post('/api/Devices/Delete', id, (res) => {
          console.log('Delete response:', res);
          if (res.isSuccessful) {
            Swal.fire('Silindi!', 'Cihaz başarıyla silindi.', 'success');
            // Cihazı array'den kaldır
            this.devices = this.devices.filter(d => d.id !== id);
            this.cdr.markForCheck();
            // SignalR üzerinden bildir
            this.signalRService.sendDeviceDeleted(id);
          } else {
            Swal.fire('Hata!', 'Cihaz silinirken hata oluştu.', 'error');
          }
        }, (err) => {
          console.error('Delete error:', err);
          Swal.fire('Hata!', 'İşlem başarısız oldu.', 'error');
        });
      }
    });
  }
}
