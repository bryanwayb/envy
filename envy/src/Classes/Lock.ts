import { Queue } from "./Queue";

export class Lock {
    private readonly _waitQueue = new Queue<() => void>();
    private _locked: boolean = false;

    Wait(): Promise<void> {
        if (this._locked) {
            return new Promise<void>(resolve => {
                this._waitQueue.Queue(resolve);
            });
        }

        this._locked = true;
        return Promise.resolve();
    }

    Release(): void {
        const nextAwaiter = this._waitQueue.Dequeue();

        if (nextAwaiter) {
            nextAwaiter();
        }
        else {
            this._locked = false;
        }
    }
}