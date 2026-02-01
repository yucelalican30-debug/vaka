

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceModel } from '../../models/device.model';
import { GenericService } from '../../services/generic';
import { SearchPipe } from '../../pipes/search-pipe';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [SearchPipe, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './device.html',
  styleUrl: './device.css',
})
export class Device implements OnInit {
  devices: DeviceModel[] = [];
  search: string = '';
  deviceForm: FormGroup;
  editMode: boolean = false;
  selectedDeviceId: string | null = null;

  constructor(private genericService: GenericService, private fb: FormBuilder) {
    this.deviceForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      seriNo: ['', Validators.required],
      durum: [false],
      sonbakimTarihi: ['']
    });
  }

  ngOnInit() {
    this.getDevices();
  }

  getDevices() {
    this.genericService.post<DeviceModel[]>('/api/Devices/GetAll', {}, (res) => {
      if (res.isSuccesful && res.data) {
        this.devices = res.data;
      }
    });
  }

  addDevice() {
    if (this.deviceForm.valid) {
      const device: DeviceModel = this.deviceForm.value;
      // Ekleme işlemi
      // API çağrısı buraya eklenebilir
      this.deviceForm.reset();
      this.editMode = false;
      this.selectedDeviceId = null;
    }
  }

  updateDevice(device: DeviceModel) {
    this.editMode = true;
    this.selectedDeviceId = device.id;
    this.deviceForm.patchValue(device);
  }

  saveUpdate() {
    if (this.deviceForm.valid && this.editMode) {
      const updatedDevice: DeviceModel = this.deviceForm.value;
      // Güncelleme işlemi
      // API çağrısı buraya eklenebilir
      this.deviceForm.reset();
      this.editMode = false;
      this.selectedDeviceId = null;
    }
  }

  cancelEdit() {
    this.deviceForm.reset();
    this.editMode = false;
    this.selectedDeviceId = null;
  }

  deleteDevice(id: string) {
    // Silme işlemi
  }
}
