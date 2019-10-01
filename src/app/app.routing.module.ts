import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { FileUploadComponent } from './fileupload/fileupload.component';
import { CustomViewerComponent } from './customviewer/customviewer.component';

const routes: Routes = [
  {path : 'welcome', component : WelcomeComponent},
  {path : 'viewFiles', component : CustomViewerComponent},
  {path : 'upload', component : FileUploadComponent}
];

export const AppRoutingModule = RouterModule.forRoot(routes);