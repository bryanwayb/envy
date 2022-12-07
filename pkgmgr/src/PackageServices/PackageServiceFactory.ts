import Container, { Service } from 'typedi';
import { DI_IPackageServiceFactory, DI_IPackageService_ChocolateyPackageService } from '../../consts';
import { IPackageService } from '../Interfaces/IPackageService';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';

@Service(DI_IPackageServiceFactory)
export default class PackageServiceFactory implements IPackageServiceFactory {
    private _packageManagerMapping: { [key: string]: string } = {
        "chocolatey": DI_IPackageService_ChocolateyPackageService
    };

    GetInstance(name: string): IPackageService {
        if (!this._packageManagerMapping[name]) {
            throw new Error(`${name} is a not a registered package manager`);
        }

        return Container.get<IPackageService>(this._packageManagerMapping[name]);
    }

    async GetAllInstances(): Promise<IPackageService[]> {
        const ret = new Array<IPackageService>();

        for (const i in this._packageManagerMapping) {
            const packageServiceInstance = this.GetInstance(i);

            if (await packageServiceInstance.IsServiceAvailable()) {
                ret.push(packageServiceInstance);
            }
        }

        return ret;
    }
};