export default class EventEmitter {
    private readonly _eventHandlers: { [key: string]: Array<(this: void, data: any) => void> } = {};

    OnEvent(event: string, handler: (this: void, data: any) => void): void {
        if (!this._eventHandlers[event]) {
            this._eventHandlers[event] = new Array<(this: void, data: any) => void>();
        }

        this._eventHandlers[event].push(handler);
    }

    EmitEvent(event: string, data: any): void {
        if (this._eventHandlers[event]) {
            for (const i in this._eventHandlers[event]) {
                const eventHandler = this._eventHandlers[event][i];
                eventHandler(data);
            }
        }
    }
}