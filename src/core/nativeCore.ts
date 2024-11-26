import { 
    createHash, 
    createLocationFromNavEntry 
} from '../helpers';
import { 
    CoreRouter, 
    HistoryLocation, 
    HistoryState, 
    InitializeRouterConfig, 
    RouteAction, 
    RouterInfoArgs, 
    RouterLocation, 
    RouterUpdate, 
    SubscribeChangeConfig 
} from '../types';

const logWrongMethodsError = () => console.error('Use the methods of the window.navigation!');

export class NativeRouterCore implements CoreRouter {

    #localState: HistoryState;
  
    #config: InitializeRouterConfig = {
        routeNames: [],
        homeUrl   : '',
    };

    constructor() {
        this.#localState = this.#createLocalState();
    }

    get state() {
        return this.#localState;
    }

    #initialize(config: InitializeRouterConfig) {
        this.#config = config;

        if(this.isExistPageByCurrentHash()) {
            this.#localState.location = createLocationFromNavEntry();
        } else {
            this.navigate(config.homeUrl);
        }
    }

    #createLocalState() {
        return {
            // для совместимости с пакетом history
            history: {
                location: {} as HistoryLocation,
                push    : logWrongMethodsError,
                replace : logWrongMethodsError,
                go      : logWrongMethodsError,
                back    : logWrongMethodsError,
                forward : logWrongMethodsError,
                listen  : () => logWrongMethodsError,
            },
            historyIndex: 0,
            prevLocation: null,
            location    : createLocationFromNavEntry(),
        };
    }

    #updateStateOnChangeHistory(update: RouterUpdate) {
        this.#localState.prevLocation = this.#localState.location;
        this.#localState.location = update.location;
        this.#localState.historyIndex++;
    }

    #subscribeOnNavigate(callback: (update: RouterUpdate) => void) {
        const updateState = (evt: NavigationEvent) => {       
            const loc = createLocationFromNavEntry(evt.destination);
            const update = {
                location: loc,
                state   : loc.state,
                action  : evt.navigationType?.toUpperCase() as RouteAction,
            };

            this.#updateStateOnChangeHistory(update);
            callback(update);
        };

        window.navigation.addEventListener('navigate', updateState);

        return () => {
            window.navigation.removeEventListener('navigate', updateState);
        };
    }

    navigate(hash: string, state?: Record<string, unknown>, queryState?: Record<string, unknown>) {        
        window.navigation.navigate(createHash(hash, queryState), { state, });
    }

    goBack() {
        window.navigation.back();
    }

    goToPrev() {
        this.goBack();
    }

    replaceState({ state, }: RouterInfoArgs = {} as RouterInfoArgs) {
        this.navigate(this.#localState.location?.hash ?? '', state);
    }

    subscribeOnListenHistory(callback: (update: RouterUpdate, prevLocation?: RouterLocation | null) => void) {        
        const handleNavigation = (evt: NavigationEvent) => {
            const update = {
                location: this.#localState.location as RouterLocation,
                state   : this.#localState.location?.state,
                action  : evt.navigationType?.toUpperCase() as RouteAction,
            };

            callback(update, this.#localState.prevLocation);
        };

        window.navigation.addEventListener('navigatesuccess', handleNavigation);

        return () => {
            window.navigation.removeEventListener('navigatesuccess', handleNavigation);
        };
    }

    initializeAndSubscribeOnChange({
        onChange,
        config,
    }: SubscribeChangeConfig) {
        this.#initialize(config);

        if(this.#localState.location) {
            onChange(this.#localState.location);
        }

        return this.#subscribeOnNavigate(() => {            
            onChange(this.#localState.location as RouterLocation);
        });
    }

    isExistPageByCurrentHash(hash = '') {
        return this.#config.routeNames.includes(hash || (this.#localState.location?.hash ?? ''));
    }

}