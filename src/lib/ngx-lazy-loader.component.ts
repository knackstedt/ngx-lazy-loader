import { Input, ViewContainerRef, isDevMode, ComponentRef, EventEmitter, Optional, ViewChild, Component, Inject, Output, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NgxLazyLoaderService } from './ngx-lazy-loader.service';
import { stringToSlug } from '../utils';
import { CompiledBundle, NgxLazyLoaderConfig } from './types';


@Component({
    selector: 'ngx-lazy-loader',
    template: `
<ng-container #content></ng-container>

<div class="distractor" [class.destroying]="isDestroyingDistractor">
    <ng-container #loader></ng-container>
</div>
  `,
    styles: [`
:host {
    display: contents;
    z-index: 1;
    position: relative;
}

.distractor {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background-color: var(--background-color, #212121);
    opacity: 1;
    transition: opacity 300ms ease;
    z-index: 999999;

}

.distractor.destroying {
    opacity: 0;
}

button {
    position: absolute;
    top: 12px;
    right: 12px;
}

`],
    imports: [CommonModule],
    standalone: true
})
export class NgxLazyLoaderComponent {
    @ViewChild("content", { read: ViewContainerRef }) targetContainer: ViewContainerRef;
    @ViewChild("loader", { read: ViewContainerRef }) distractorContainer: ViewContainerRef;

    /**
     * ! Here be dragons.
     * Only the bravest of Adventurers can survive the battles below,
     * and they must be trained and ready for the gruelling journey ahead.
     * Many a soul has tried to best these Dragons, yet only one has
     * succeeded since our founding.
     *
     * TL;DR -- Don't mess with this unless you know what you're doing.
     *     This is central to a ton of moving parts -- breaking it will
     *     cause more collateral damage than you may realize.
     */

    private _id: string;
    /**
     * The id of the component that will be lazy loaded
     */
    @Input("component") set id(data: string) {
        const id = stringToSlug(data);

        // Check if there is a change to the loaded component's id
        // if it's updated, we destroy and rehydrate the entire container
        if (this.initialized && this._id != id) {
            this.ngAfterViewInit();
        }

        this._id = id;
    };


    private _group = "default";
    @Input("group") set group(data: string) {
        const group = stringToSlug(data);

        if (typeof group != "string" || !group) return;

        // If the group was updated, retry to bootstrap something into the container.
        if (this.initialized && this._group != group) {
            this._group = group;

            this.ngAfterViewInit();
            return;
        }

        this._group = group;
    }
    get group() { return this._group }

    private _inputs: { [key: string]: any; };
    /**
     * A map of inputs to bind to the child.
     * Supports change detection. (May fail on deep JSON changes)
     *
     * ```html
     * <lazy-loader component="MyLazyComponent"
     *       [inputs]="{
     *          prop1: true,
     *          prop2: false,
     *          complex: {
     *              a: true,
     *              b: 0
     *          }
     *       }"
     * >
     * </lazy-loader>
     * ```
     */
    @Input("inputs") set inputs(data: { [key: string]: any; }) {
        if (data == undefined) return;

        let previous = this._inputs;
        this._inputs = data;
        if (data == undefined)
            console.trace(data);

        if (this.targetComponentFactory) {
            const { inputs } = this.targetComponentFactory.ɵcmp;

            const currentKeys = Object.keys(inputs);

            const oldKeys = Object.keys(previous).filter(key => currentKeys.includes(key));
            const newKeys = Object.keys(data).filter(key => currentKeys.includes(key));

            const removed = oldKeys.filter(key => !newKeys.includes(key));

            // ? perhaps set to null or undefined instead
            removed.forEach(k => this.targetComponentInstance[k] = null);

            this.bindInputs();
        }
    }


    private outputSubscriptions: { [key: string]: Subscription; } = {};
    private _outputs: { [key: string]: Function; };
    /**
     * A map of outputs to bind from the child.
     * Should support change detection.
     * ```html
     * <lazy-loader component="MyLazyComponent"
     *       [outputs]="{
     *           prop3: onOutputFire
     *       }"
     * >
     * </lazy-loader>
     * ```
     */
    @Input("outputs") set outputs(data: { [key: string]: Function; }) {
        let previous = this._outputs;
        this._outputs = data;

        if (this.targetComponentFactory) {
            const { inputs } = this.targetComponentFactory.ɵcmp;

            const currentKeys = Object.keys(inputs);
            const removed = Object.keys(previous).filter(key => !currentKeys.includes(key));

            removed.forEach(k => {
                // Unsubscribe from observable
                this.outputSubscriptions[k]?.unsubscribe();
                delete this.targetComponentInstance[k];
            });

            this.bindOutputs();
        }
    }

    /**
     * Emits errors encountered when loading components
     */
    @Output() componentLoadError = new EventEmitter();

    /**
     * Emits when the component is fully constructed
     * and had it's inputs and outputs bound
     * > before `OnInit`
     *
     * Returns the active class instance of the lazy-loaded component
     */
    @Output() componentLoaded = new EventEmitter();


    /**
     * Container that provides the component data
     */
    private targetModule: CompiledBundle;

    /**
     * Component definition
     */
    private targetComponentFactory: any;

    /**
     * Active component container reference
     */
    private targetComponentContainerRef: ComponentRef<any>;
    private targetRef: any;
    /**
     * Reference to the component class instance
     */
    private targetComponentInstance: any;

    /**
     * Distractor component container reference
     */
    private distractorComponentRef: ComponentRef<any>;
    private distractorRef: any;


    isDestroyingDistractor = false;
    isDistractorVisible = true;

    /**
     * Subscription with true/false state on whether the distractor should be
     */
    private distractorSubscription: Subscription;

    private config: NgxLazyLoaderConfig;
    private err;
    private warn;
    private log;

    constructor(
        private service: NgxLazyLoaderService,
        @Optional() private viewContainerRef: ViewContainerRef,
        @Optional() public dialog: DialogRef,
        @Optional() @Inject(MAT_DIALOG_DATA) public dialogArguments
    ) {
        this.config = NgxLazyLoaderService.config;
        this.err = NgxLazyLoaderService.config.logger.err;
        this.warn = NgxLazyLoaderService.config.logger.warn;
        this.log = NgxLazyLoaderService.config.logger.log;
    }

    ngOnInit() {
        this.showDistractor();
    }

    private initialized = false;
    async ngAfterViewInit() {
        this.ngOnDestroy();
        this.initialized = true;

        // First, check for dialog arguments
        // if (this.dialogArguments) {
        //     this.inputs = this.dialogArguments.data?.inputs || this.dialogArguments.data;
        //     this.outputs = this.dialogArguments.data?.outputs;
        //     this.id = this.dialogArguments.id;
        // }

        if (!this._id) {
            this.warn("No component was specified!");
            return this.loadDefault();
        }

        try {
            const entry = this.service.getRegistrationEntry(this._id, this._group);

            if (!entry) {
                this.err(`Failed to find Component '${this._id}' in registry!`);
                return this.loadDefault();
            }

            // Download the "module" (the standalone component)
            const bundle: CompiledBundle = this.targetModule = await entry.load();


            // Check if there is some corruption on the bundle.
            if (bundle['__esModule'] as any !== true || bundle.toString() != "[object Module]") {
                this.err(`Failed to load component/module for '${this._id}'! Parsed resource is invalid.`);
                return this.loadError();
            }

            const modules = Object.keys(bundle)
                .map(k => {
                    const entry = bundle[k];

                    // Strictly check for exported modules or standalone components
                    if (typeof entry == "function" && typeof entry["ɵfac"] == "function")
                        return entry;
                    return null;
                })
                .filter(e => e != null)
                .filter(entry => {
                    entry['_isModule'] = !!entry['ɵmod']; // module
                    entry['_isComponent'] = !!entry['ɵcmp']; // component

                    return (entry['_isModule'] || entry['_isComponent']);
                });

            if (modules.length == 0) {
                this.err(`Component/Module loaded for '${this._id}' has no exported components or modules!`);
                return this.loadError();
            }

            const component = this.targetComponentFactory = this.service.resolveComponent(this._id, "default", modules);

            if (!component) {
                this.err(`Component '${this._id}' is invalid or corrupted!`);
                return this.loadError();
            }


            // Bootstrap the component into the container
            const componentRef = this.targetComponentContainerRef = this.targetContainer.createComponent(component as any);
            this.targetRef = this.targetContainer.insert(this.targetComponentContainerRef.hostView);

            const instance: any = this.targetComponentInstance = componentRef['instance'];

            this.bindInputs();
            this.bindOutputs();

            this.componentLoaded.next(instance);

            // Look for an observable called isLoading$ that will make us show/hide
            // the same distractor that is used on basic loading
            const isLoading$ = instance['ngxShowDistractor$'] as BehaviorSubject<boolean>;
            if (isLoading$ && typeof isLoading$.subscribe == "function") {
                this.distractorSubscription = isLoading$.subscribe(loading => {
                    if (!loading)
                        this.hideDistractor();
                    else
                        this.showDistractor();
                });
            }

            const name = Object.keys(bundle)[0];
            this.log(`Loaded '${name}'`);

            if (!isLoading$)
                this.hideDistractor();

            return componentRef;
        }
        catch (ex) {

            if (isDevMode()) {
                console.warn("Component " + this._id + " threw an error on mount!");
                console.warn("This will cause you to see a 404 panel.");
                console.error(ex);
            }

            // Network errors throw a toast and return an error component
            if (ex && !isDevMode()) {
                console.error("Uncaught error when loading component");
                throw ex;
            }

            return this.loadDefault();
        }
    }

    ngOnDestroy() {
        // unsubscribe from all subscriptions
        Object.entries(this.outputSubscriptions).forEach(([key, sub]) => {
            sub.unsubscribe();
        });
        this.outputSubscriptions = {};

        // Clear the views
        this.distractorSubscription?.unsubscribe();

        // Clear target container
        this.targetRef?.destroy();
        this.targetComponentContainerRef?.destroy();
        this.targetContainer?.clear();

        this.distractorRef?.destroy();
        this.distractorComponentRef?.destroy();
        this.distractorContainer?.clear();

        // Wipe the rest of the state clean
        this.distractorSubscription = null;
        this.targetRef = null;
        this.targetComponentContainerRef = null;
        this.distractorRef = null;
        this.distractorComponentRef = null;
    }

    /**
     * Bind the input values to the child component.
     */
    private bindInputs() {
        if (!this._inputs || !this.targetComponentInstance) return;

        // forward-bind inputs
        const { inputs } = this.targetComponentFactory.ɵcmp;

        // Returns a list of entries that need to be set
        // This makes it so that unnecessary setters are not invoked.
        const updated = Object.entries(inputs).filter(([parentKey, childKey]: [string, string]) => {
            return this.targetComponentInstance[childKey] != this._inputs[parentKey];
        });

        updated.forEach(([parentKey, childKey]: [string, string]) => {
            if (this._inputs.hasOwnProperty(parentKey))
                this.targetComponentInstance[childKey] = this._inputs[parentKey];
        });
    }

    /**
     * Bind the output handlers to the loaded child component
     */
    private bindOutputs() {
        if (!this._outputs || !this.targetComponentInstance) return;

        const { outputs } = this.targetComponentFactory.ɵcmp;

        // Get a list of unregistered outputs
        const newOutputs = Object.entries(outputs).filter(([parentKey, childKey]: [string, string]) => {
            return !this.outputSubscriptions[parentKey];
        });

        // Reverse bind via subscription
        newOutputs.forEach(([parentKey, childKey]: [string, string]) => {
            if (this._outputs.hasOwnProperty(parentKey)) {
                const target: EventEmitter<unknown> = this.targetComponentInstance[childKey];
                const outputs = this._outputs;

                // Angular folks, stop making this so difficult.
                const ctx = this.viewContainerRef['_hostLView'][8];
                const sub = target.subscribe(outputs[parentKey].bind(ctx)); // Subscription

                this.outputSubscriptions[parentKey] = sub;
            }
        });
    }

    /**
     * Show the progress spinner
     */
    private showDistractor() {

        if (this.config.loaderDistractorComponent) {
            // If we're already showing the distractor, do nothing.
            if (this.distractorRef) return;

            this.distractorComponentRef = this.distractorContainer.createComponent(this.config.loaderDistractorComponent);
            this.distractorRef = this.distractorContainer.insert(this.distractorComponentRef.hostView);
        }
    }

    /**
     * Clear the progress spinner
     */
    private hideDistractor() {
        this.isDestroyingDistractor = true;

        setTimeout(() => {
            // Dispose of the distractor ref bindings

            this.distractorRef?.destroy();
            this.distractorComponentRef?.destroy();

            this.distractorRef = null;
            this.distractorComponentRef = null;
        }, 300);
    }

    /**
     * Load the "Default" component (404) screen normally.
     * This is shown when the component id isn't in the
     * registry or otherwise doesn't match
     *
     * This
     */
    private loadDefault() {
        if (this.config.notFoundComponent)
            this.targetContainer.createComponent(this.config.notFoundComponent);

        this.hideDistractor();
    }

    /**
     * Load the "Error" component.
     * This is shown when we are able to resolve the component
     * in the registry, but have some issue boostrapping the
     * component into the viewContainer
     */
    private loadError() {
        if (this.config.errorComponent)
            this.targetContainer.createComponent(this.config.errorComponent);

        this.hideDistractor();
    }
}
