export enum ComponentResolveStrategy {
    /**
     * Match the fist component we find
     * (best used for standalone components)
     * @default
     */
    PickFirst,
    /**
     * Perform an Exact ID to Classname of the Component
     * case sensitive, zero tolerance.
     */
    MatchIdToClassName,
    /**
     * Perform a fuzzy ID to classname match
     * case insensitive, mutes symbols
     * ignores "Component" and "Module" postfixes on class
     * names
     */
    FuzzyIdClassName,

    /**
     * Use a user-provided component match function
     */
    Custom
}

export type NgxLazyLoaderConfig = Partial<{
    entries: ComponentRegistration[],
    notFoundComponent,
    errorComponent,
    loaderDistractorComponent,
    logger: {
        log: (...args: any) => void,
        warn: (...args: any) => void,
        err: (...args: any) => void;
    },
    /**
     * What strategy should be used to resolve components
     * @default ComponentResolveStrategy.FuzzyIdClassName
     */
    componentResolveStrategy: ComponentResolveStrategy,
    customResolver: (registry: (CompiledComponent | CompiledModule)[]) => Object
}>;

export interface ComponentRegistration {
    id: string,
    /**
     * Specify a group to categorize components. If not specified,
     * will default to the `default` group.
     */
    group?: string,
    load: () => any,

    [key: string]: any
}[];

/**
 * This is roughly a compiled component
 */
export type CompiledComponent = {
    (): CompiledComponent,
    ɵfac: Function,
    ɵcmp: {
        consts;
        contentQueries;
        data;
        declaredInputs;
        decls;
        dependencies;
        directiveDefs;
        encapsulation;
        exportAs;
        factory;
        features;
        findHostDirectiveDefs;
        getStandaloneInjector;
        hostAttrs;
        hostBindings;
        hostDirectives;
        hostVars;
        id: string;
        inputs;
        ngContentSelectors;
        onPush: boolean;
        outputs;
        pipeDefs;
        providersResolver;
        schemas;
        selectors: string[];
        setInput;
        standalone: boolean;
        styles: string[];
        tView;
        template;
        type: Function;
        vars: number;
        viewQuery;
    };
};

/**
 * This is roughly a compiled module
 */
export type CompiledModule = {
    (): CompiledModule,
    ɵfac: Function,
    ɵinj: {
        providers: any[],
        imports: any[];
    },
    ɵmod: {
        bootstrap: any[],
        declarations: Function[],
        exports: any[],
        id: unknown,
        imports: any[],
        schemas: unknown,
        transitiveCompileScopes: unknown,
        type: Function;
    };
};

export type CompiledBundle = { [key: string]: CompiledComponent | CompiledModule; };


