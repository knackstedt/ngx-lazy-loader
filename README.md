<a href="https://dotglitch.dev">
  <h1 align="center">ngx-lazy-loader</h1>
</a>

<p align="center">
  ngx-lazy-loader is a lazy-loader that makes lazy-loaded components _not suck_
</p>

[![npm](https://img.shields.io/npm/v/@dotglitch/ngx-lazy-loader.svg)](https://www.npmjs.com/package/@dotglitch/ngx-lazy-loader)
[![npm](https://img.shields.io/npm/dm/@dotglitch/ngx-lazy-loader.svg)](https://www.npmjs.com/package/@dotglitch/ngx-lazy-loader)
[![npm downloads](https://img.shields.io/npm/dt/@dotglitch/ngx-lazy-loader.svg)](https://npmjs.org/@dotglitch/ngx-lazy-loader)
[![GitHub stars](https://img.shields.io/github/stars/knackstedt/ngx-lazy-loader.svg?label=GitHub%20Stars&style=flat)](https://github.com/knackstedt/ngx-lazy-loader)




Quickstart 
=====

## Install

```bash
$ npm install @dotglitch/ngx-lazy-loader
```


### Import with App Module

```typescript
import { NgModule } from '@angular/core';
import { NgxLazyLoaderModule } from '@dotglitch/ngx-lazy-loader';
import { RegisteredComponents } from 'src/app/component.registry';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        ...
        NgxLazyLoaderModule.forRoot({
            entries: RegisteredComponents
        })
    ]
    bootstrap: [AppComponent]
})
export class AppModule {
}
```

### Import with App Component

```typescript
import { Component } from '@angular/core';
import { NgxLazyLoaderModule } from '@dotglitch/ngx-lazy-loader';
import { RegisteredComponents } from 'src/app/component.registry';

@Component({
    ...
    imports: [
        ...
        NgxLazyLoaderModule.forRoot({
            entries: RegisteredComponents
        })
    ,
    standalone: true
})
export class AppComponent { }
```

component.registry.ts: 
```ts
import { ComponentRegistration } from '@dotglitch/ngx-lazy-loader';

export const RegisteredComponents: ComponentRegistration[] = [
    // Landing page -- neat.
    { id: 'Landing', load: () => import('src/app/pages/general/landing/landing.component'), icon: "home", order: 0 },
    // About page
    { id: 'About', load: () => import('src/app/pages/general/about/about.component'), icon: "info", order: 10000 },
    // Terms of use is a dialog
    { id: 'TermsOfUse', load: () => import('src/app/pages/general/termsofuse/termsofuse.component'), hidden: true },
]
```
> Notice that this has additional properties `icon`, `order` and `hidden`. These are used 
> by the client application to render menus and are ignored by ngx-lazy-loader.


### Loading a Component
```html
<ngx-lazy-loader
    class="foo"
    component="TestChild"
    [inputs]="{
        prop1: value1,
        prop2: value2
    }"
    [outputs]="{
        buttonClicked: onChildButtonClicked
    }"
/>
```


Examples
=====

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/avajs/ava/tree/main/examples/typescript-basic?file=source%2Ftest.ts&terminal=test&view=editor)


Configuration
=====

```ts
NgxLazyLoaderModule.forRoot({
    /**
     * A list of lazy-loadable component registrations that we will
     * initialize with. This list can be added to during runtime.
     * Adding a component _after_ loading it via the lazy loader 
     * will not auto-resolve the component off of the notFoundComponent
     */
    entries: RegisteredComponents,
    /**
     * A component to show when the loader can't resolve a provided ID
     */
    notFoundComponent,
    /**
     * WIP: A component to show when something functionally fails when
     * bootstrapping a lazy-loadable component. 
     * > usually happens in the constructor 
     */
    errorComponent,
    /**
     * A component to show as a progress spinner / distractor
     */
    loaderDistractorComponent,
    /**
     * What strategy should be used to resolve components
     * @default ComponentResolveStrategy.FuzzyIdClassName
     */
    componentResolveStrategy: ComponentResolveStrategy,
    /**
     * When `componentResolveStrategy` is set to `Custom`,
     * the method that identifies which component to resolve to.
     */
    customResolver: (registry: (CompiledComponent | CompiledModule)[]) => Object
})
```

### Component Grouping
If you use a lot of components all over the place, you may need to group lazy-loadable 
components in order to organize them and ensure that you don't encounter conflicts.

All you need to do when registering the component is add the group property:

component.registry.ts: 
```ts
import { ComponentRegistration } from '@dotglitch/ngx-lazy-loader';

export const RegisteredComponents: ComponentRegistration[] = [
    // Components are added into the "default" group unless otherwise specified.
    { id: 'Landing', load: () => import('src/app/pages/general/landing/landing.component')},
    { id: 'About', load: () => import('src/app/pages/general/about/about.component')},

    { id: 'TermsOfUse', group: "dialog", load: () => import('src/app/pages/general/termsofuse/termsofuse.component') },
    { id: 'PrivacyPolicy', group: "dialog", load: () => import('src/app/pages/general/privacypolicy/privacypolicy.component') },

    { id: 'barchart', group: "chart", load: () => import('src/app/@charts/barchart/barchart.component')},
    { id: 'piechart', group: "chart", load: () => import('src/app/@charts/piechart/piechart.component')},
    { id: 'areachart', group: "chart", load: () => import('src/app/@charts/areachart/areachart.component')},
    { id: 'mapchart', group: "chart", load: () => import('src/app/@charts/mapchart/mapchart.component')},
    { id: 'histogram', group: "chart", load: () => import('src/app/@charts/histogram/histogram.component')},

    // You can overlap IDs as long as they have different groups
    { id: 'barchart', group: "dashboardtile", load: () => import('src/app/pages/dashboard/@tiles/barchart/barchart.component')},
    { id: 'piechart', group: "dashboardtile", load: () => import('src/app/pages/dashboard/@tiles/piechart/piechart.component')},
    { id: 'areachart', group: "dashboardtile", load: () => import('src/app/pages/dashboard/@tiles/areachart/areachart.component')},
    { id: 'mapchart', group: "dashboardtile", load: () => import('src/app/pages/dashboard/@tiles/mapchart/mapchart.component')},
    { id: 'histogram', group: "dashboardtile", load: () => import('src/app/pages/dashboard/@tiles/histogram/histogram.component')},
]
```

Then, you just need to add the group when you reference the component: 

```html
<ngx-lazy-loader
    class="foo"
    component="TestChild"
    [inputs]="{
        prop1: value1,
        prop2: value2,
        prop5: 'asd',
        complex: complicated,
        myExternalKey: 'balloon'
    }"
    [outputs]="{
        prop3: onOutputFire,
        buttonClicked: onChildButtonClicked
    }"
/>

```

