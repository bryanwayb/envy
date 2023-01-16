export default class HashSet<T> {
    private _hash: { [key: string]: T } = {};

    private GetStringRepresentation(obj: T) {
        switch (typeof obj) {
            case 'string':
                return obj;
            case 'number':
                return obj.toString();
            default:
                return JSON.stringify(obj);
        }
    }

    public Add(obj: T): boolean {
        if (obj === undefined) {
            throw new Error('Cannot add undefined to a HashSet');
        }

        const hashKey = this.GetStringRepresentation(obj);
        if (this._hash[hashKey] === undefined) {
            this._hash[hashKey] = obj;
            return true;
        }
        return false;
    }

    public Contains(obj: T): boolean {
        const hashKey = this.GetStringRepresentation(obj);
        return this._hash[hashKey] !== undefined;
    }

    public GetItems(): T[] {
        const hashKeys = Object.keys(this._hash);
        const items: T[] = [];

        for (const i in hashKeys) {
            items.push(this._hash[hashKeys[i]]);
        }

        return items;
    }
}