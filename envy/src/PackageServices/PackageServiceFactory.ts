import Container, { Service } from 'typedi';
import { DI_IPackageServiceFactory, DI_IPackageService_ChocolateyPackageService } from '../../consts';
import { IPackageService } from '../Interfaces/IPackageService';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageServiceOptions } from './Models/PackageServiceOptions';

@Service(DI_IPackageServiceFactory)
export default class PackageServiceFactory implements IPackageServiceFactory {
    private _packageManagerMapping: { [key: string]: string } = {
        "choco": DI_IPackageService_ChocolateyPackageService
    };

    async GetInstance(name: string, options: PackageServiceOptions): Promise<IPackageService> {
        if (!this._packageManagerMapping[name]) {
            throw new Error(`${name} is a not a registered package manager`);
        }

        const instance = Container.get<IPackageService>(this._packageManagerMapping[name]);
        return await instance.WithOptions(options);
    }

    async GetAllInstances(options: PackageServiceOptions): Promise<IPackageService[]> {
        const ret = new Array<IPackageService>();

        for (const i in this._packageManagerMapping) {
            const packageServiceInstance = await this.GetInstance(i, options);

            if (await packageServiceInstance.IsServiceAvailable()) {
                ret.push(packageServiceInstance);
            }
        }

        return ret;
    }
};