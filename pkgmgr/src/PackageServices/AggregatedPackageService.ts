import Container, { Service } from 'typedi';
import { IPackageService } from '../Interfaces/IPackageService';
import { DI_IPackageServiceFactory, DI_IPackageService_AggregatedPackageService } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from './Models/PackageModel';

@Service(DI_IPackageService_AggregatedPackageService)
export default class ChocolateyPackageService implements IPackageService {
    private _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);

    async GetInstalled(): Promise<Array<PackageModel>> {
        const instances = await this._packageServiceFactory.GetAllInstances();

        const response = new Array<PackageModel>();
        for (const i in instances) {
            const instanceResponse = await instances[i].GetInstalled();
            response.push(...instanceResponse);
        }

        return response;
    }

    async SearchPackages(query: string): Promise<PackageModel[]> {
        const instances = await this._packageServiceFactory.GetAllInstances();

        const response = new Array<PackageModel>();
        for (const i in instances) {
            const instanceResponse = await instances[i].SearchPackages(query);
            response.push(...instanceResponse);
        }

        return response;
    }

    IsAvailable(): Promise<boolean> {
        return Promise.resolve(true);
    }
};