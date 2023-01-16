import { Service } from 'typedi';
import { Lock } from '../Classes/Lock';

@Service()
export default class LockPoolService {
    private readonly _lockLookup: { [key: string]: Lock } = {};

    GetLock(name: string): Lock {
        let lock = this._lockLookup[name];
        if (!lock) {
            lock = this._lockLookup[name] = new Lock();
        }
        return lock;
    }
};