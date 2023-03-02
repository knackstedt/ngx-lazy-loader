import { Inject, Injectable, InjectionToken, Component, NgModule, isDevMode } from '@angular/core';
import { CompiledComponent, CompiledModule, ComponentRegistration, ComponentResolveStrategy, NgxLazyLoaderConfig } from './types';
import { stringToSlug } from '../utils';
import { Logger } from '../utils/logger';


export const NGX_LAZY_LOADER_CONFIG = new InjectionToken<NgxLazyLoaderConfig>('config');

@Injectable({
    providedIn: 'root'
})
export class NgxLazyLoaderService {

    // A proxied registry that mutates reference keys
    private static registry: {
        [key: string]: { // group
            [key: string]: { // id
                id: string, load: Function;
            };
        };
    } = {};

    // static set ComponentRegistry(data: ComponentRegistration[]) {
    //     // data.map(c => (;
    //     for (let i = 0; i < data.length; i++)
    //         this.addComponentToRegistry(data[i]);
    // }
    // static get ComponentRegistry() {
    //     return this.registryArr as ComponentRegistration[];
    // }

    public static config: NgxLazyLoaderConfig;

    constructor(@Inject(NGX_LAZY_LOADER_CONFIG) config: NgxLazyLoaderConfig = {}) {
        NgxLazyLoaderService.configure(config);
    }

    private static configure(config: NgxLazyLoaderConfig) {
        const { log, warn, err } = Logger("ngx-lazy-loader", "#009688");

        this.config = {
            componentResolveStrategy: ComponentResolveStrategy.PickFirst,
            logger: {
                log,
                warn,
                err
            },
            ...config
        };

        config.entries?.forEach(e => this.addComponentToRegistry(e))

        // If a custom resolution strategy is provided but no resolution function is passed,
        // we throw an error
        if (
            this.config.componentResolveStrategy == ComponentResolveStrategy.Custom &&
            !this.config.customResolver
        ) {
            throw new Error("Cannot initialize. Configuration specifies a custom resolve matcher but none was provided");
        }
    }

    private static addComponentToRegistry(registration: ComponentRegistration) {
        if (!registration)
            throw new Error("Cannot add " + registration + " component into registry.");

        // Clone the object into our repository and transfer the id into a standardized slug format

        const id = stringToSlug(registration.id); // purge non-basic ASCII chars
        const group = registration.group || "default";


        const entry = {
            ...registration,
            group: group,
            id: id
        };

        if (!this.registry[group])
            this.registry[group] = {};

        // Check if we already have a registration for the component
        if (this.registry[group] && typeof this.registry[group]['load'] == "function") {
            // Warn the developer that the state is problematic
            this.config.logger.warn(
                `A previous entry already exists for ${id}! The old registration will be overridden.` +
                `Please ensure you use groups if you intend to have duplicate component ids. ` +
                `If this was intentional, first remove the old component from the registry before adding a new instance`
            );

            // If we're in dev mode, break the loader surface
            if (isDevMode())
                return;
        }

        this.registry[group][id] = entry;
    }

    /**
     * Register an Angular component
     * @param id identifier that is used to resolve the component
     * @param group
     * @param component Angular Component Class constructor
     */
    public registerComponent<T extends { new(...args: any[]): InstanceType<T>; }>(id: string, group = "default", component: T) {
        NgxLazyLoaderService.addComponentToRegistry({
            id: stringToSlug(id),
            group: stringToSlug(group),
            load: () => component
        })
    }

    /**
     *
     * @param id
     * @param group
     */
    public unregisterComponent(id: string, group = "default") {
        const _id = stringToSlug(id);
        const _group = stringToSlug(group);

        if (!this.getRegistrationEntry(id, group))
            throw new Error("Cannot unregister component ${}! Component is not present in registry")

        // TODO: handle clearing running instances
        delete NgxLazyLoaderService.registry[_group][_id];
    }


    /**
     * Get the registration entry for a component.
     * Returns null if component is not in the registry.
     */
    public getRegistrationEntry(id: string, group = "default") {
        const _id = stringToSlug(id);
        const _group = stringToSlug(group);

        return (NgxLazyLoaderService.registry[_group] || {})[_id];
    }

    /**
     * Check if a component is currently registered
     */
    public isComponentRegistered(id: string, group = "default") {
        return !!this.getRegistrationEntry(id, group);
    }

    /**
     *
     * @param bundle
     * @returns The component `Object` if a component was resolved, `null` if no component was found
     * `false` if the specified strategy was an invalid selection
     */
    public resolveComponent(id: string, group: string, modules: (CompiledComponent | CompiledModule)[]): Object | null | false {

        switch (NgxLazyLoaderService.config.componentResolveStrategy) {
            case ComponentResolveStrategy.PickFirst: {

                return modules[0];
            }

            // Exact id -> classname match
            case ComponentResolveStrategy.MatchIdToClassName: {
                const matches =
                    modules
                        .filter(k => k.name == id);

                if (matches.length == 0)
                    return null;

                return matches[0];
            }
            // Fuzzy id -> classname match
            case ComponentResolveStrategy.FuzzyIdClassName: {
                const _id = id.replace(/[^a-z0-9_\-]/ig, '');

                if (_id.length == 0) {
                    NgxLazyLoaderService.config.logger.err("Fuzzy classname matching stripped all symbols from the ID specified!");
                    return false;
                }

                const rx = new RegExp(`^${id}(component|module)?$`, "i");

                const matches = modules
                    .filter(mod => {
                        let kid = mod.name.replace(/[^a-z0-9_\-]/ig, '');

                        return rx.test(kid);
                    });

                if (matches.length > 1) {
                    NgxLazyLoaderService.config.logger.err("Fuzzy classname matching resolved multiple targets!");
                    return false;
                }

                if (matches.length == 0) {
                    NgxLazyLoaderService.config.logger.err("Fuzzy classname matching resolved no targets!");
                    return null;
                }

                return matches[0];
            }
            case ComponentResolveStrategy.Custom: {
                return NgxLazyLoaderService.config.customResolver(modules as any);
            }
            default: {
                return false;
            }
        }
    }
}
