
import { Routes } from '@angular/router';
import { NotFound } from './components/not-found/not-found';
import { Layout } from './components/layout/layout';
import { Device } from './components/device/device';

export const routes: Routes = [
	{
		path: '',
		component: Layout,
		children: [
			{ path: '', redirectTo: 'devices', pathMatch: 'full' },
			{ path: 'devices', component: Device },
		]
	},
	{ path: '**', component: NotFound },
];
