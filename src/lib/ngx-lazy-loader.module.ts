import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { NgxLazyLoaderConfig } from './types';
import { NgxLazyLoaderComponent } from './ngx-lazy-loader.component';
import { NgxLazyLoaderService, NGX_LAZY_LOADER_CONFIG } from './ngx-lazy-loader.service';

@NgModule({
    imports: [NgxLazyLoaderComponent],
    exports: [NgxLazyLoaderComponent]
})
export class NgxLazyLoaderModule {

    public static forRoot(config: NgxLazyLoaderConfig): ModuleWithProviders<NgxLazyLoaderModule> {

        return ({
            ngModule: NgxLazyLoaderModule,
            providers: [
                NgxLazyLoaderService,
                {
                    provide: NGX_LAZY_LOADER_CONFIG,
                    useValue: config
                }
            ]
        });
    }

    private static instanceLoaded = false
    constructor(){ //@Optional() @SkipSelf() parentModule?: NgxLazyLoaderModule) {
        if (!NgxLazyLoaderModule.instanceLoaded) {
            NgxLazyLoaderModule.instanceLoaded = true;
        }
        else {
            throw new Error('NgxLazyLoaderModule is already loaded. Import it in AppModule only');
        }
        // if (parentModule) {
        // }
        // console.log("ngxlazyloader")
    }
}
