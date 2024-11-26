import { createHashHistory } from 'history';

import { 
    checkIsHistoryInstance, 
    getClearedHistoryFullHash, 
    getClearedHistoryHash, 
    modifyLocation 
} from '../helpers';
import { 
    CoreRouter, 
    HistoryState, 
    InitializeRouterConfig, 
    RouterHistory, 
    RouterInfoArgs, 
    RouterLocation, 
    RouterUpdate, 
    SubscribeChangeConfig 
} from '../types';

export class HashHistoryRouterCore implements CoreRouter {

    private localState: HistoryState;

    private config: InitializeRouterConfig = {
        routeNames: [],
        homeUrl   : '',
    };

    constructor() {
        this.localState = this.createLocalState();
    }

    get state() {
        return this.localState;
    }

    updateLocalHistory(externalHistory?: RouterHistory) {
        if(!externalHistory || !checkIsHistoryInstance(externalHistory)) {
            return;
        }
        this.localState.history = externalHistory;
    }

    createLocalState() {
        const newHistory = createHashHistory();

        return {
            history     : newHistory,
            historyIndex: 0,
            prevLocation: null,
            location    : modifyLocation(newHistory.location),
        };
    }

    navigate(hash: string, state?: Record<string, unknown>) {
        this.localState.history.push({ hash, }, state);
    }

    goBack() {
        this.localState.history.back();
    }

    goToPrev() {
        if(this.localState.historyIndex === 0 || !this.localState.prevLocation) {
            this.goBack();
            return;
        }
        this.replaceState({
            hash : this.localState.prevLocation.hash, 
            state: this.localState.prevLocation.state as Record<string, unknown> | undefined,
        });
    }

    replaceState({ state, hash, }: RouterInfoArgs = {} as RouterInfoArgs) {
        return this.navigate(hash ?? getClearedHistoryHash(this.localState.history.location.hash), state);
    }

    subscribeOnListenHistory(callback: (update: RouterUpdate, prevLocation?: RouterLocation | null) => void) {
        const unlisten = this.localState.history.listen((update) => {
            callback(update, this.localState.prevLocation);
        });

        return () => {
            unlisten();
        };
    }

    updateStateOnChangeHistory(update: RouterUpdate) {
        this.localState.prevLocation = this.localState.location;
        this.localState.location = modifyLocation(update.location);
        this.localState.historyIndex += 1;
    }

    initialize (config: InitializeRouterConfig) {
        this.config = config;
        const mustRedirectToMain = !this.isExistPageByCurrentHash();

        if(!mustRedirectToMain) {
            this.localState.location = modifyLocation(this.localState.history.location);
        } else {
            this.localState.location = {
                ...this.localState.history.location,
                query: undefined,
                hash : config.homeUrl,
            };
        }
    }

    initializeAndSubscribeOnChange({ 
        onChange, 
        config, 
        externalHistory, 
    }: SubscribeChangeConfig) {
        if(externalHistory) {
            this.updateLocalHistory(externalHistory);
        }
        this.initialize(config);

        if(this.localState.location) {
            onChange(this.localState.location);
        }

        return this.subscribeOnListenHistory((update) => {
            this.updateStateOnChangeHistory(update);
            onChange(this.localState.location as RouterLocation);
        });
    }

    isExistPageByCurrentHash(hash = '') {    
        return this.config.routeNames.includes(hash || getClearedHistoryFullHash(this.localState.history.location.hash));
    }

}