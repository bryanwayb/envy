export default class Queue<T> {
    private readonly _queue: T[] = [];

    public Queue(item: T): void {
        this._queue.push(item);
    }

    public Dequeue(): T {
        if (this._queue.length > 0) {
            return this._queue.splice(0, 1)[0];
        }
        return null;
    }
}
