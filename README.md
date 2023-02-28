# NgxLazyLoader

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.1.0.

## Code scaffolding

Run `ng generate component component-name --project ngx-lazy-loader` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project ngx-lazy-loader`.
> Note: Don't forget to add `--project ngx-lazy-loader` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build ngx-lazy-loader` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build ngx-lazy-loader`, go to the dist folder `cd dist/ngx-lazy-loader` and run `npm publish`.

## Running unit tests

Run `ng test ngx-lazy-loader` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.





## Usage

### Getting started

Setup in your `AppModule` like so: 
```ts
@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ...
        NgxLazyLoaderModule.forRoot({
            notFoundComponent: MyComponent,
            errorComponent: MyErrorComponent,
            loaderDistractorComponent: MyProgressComponent
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
```


### Configuring when the progress-distractor is shown

We've made it very simple on when the progress distractor is shown, create a 
BehaviorSubject `ngxShowDistractor$` and the loader will read it and automatically
show the provided distractor whenever the value is `true`

```typescript
import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: [],
    standalone: true
})
export class ExampleComponent {

    ngxShowDistractor$ = new BehaviorSubject(true);
}

```

### Extending use
This package export the `NgxLazyLoaderService` via DI that you can use to dynamically
add and remove components with, and have more fine-tuned control over the operation
of the lazy loader
