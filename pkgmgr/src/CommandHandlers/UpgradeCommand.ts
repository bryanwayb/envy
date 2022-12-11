import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_UpgradeCommand } from '../../consts';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';

@Service(DI_ICommandHandler_UpgradeCommand)
export default class UpgradeCommand extends BaseCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        this._logger.LogTrace(`preparing to upgrade packages`);

        const upgradePackages = new Array<PackageModel>();
        const missingPackages = new Array<PackageModel>();
        const ignoredPackages = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();
        if (passedPackages.length > 0) {
            //for (const i in passedPackages) {
            //    const passedPackage = passedPackages[i];

            //    await this.EnsurePackageHasManager(passedPackage);

            //    const packageService = this._packageServiceFactory.GetInstance(passedPackage.Manager);

            //    const installedPackage = await packageService.GetInstalledPackage(passedPackage);

            //    if (installedPackage) {
            //        this._logger.LogTrace(`package ${installedPackage} is installed`);
            //        upgradePackages.push(installedPackage);
            //    }
            //    else {
            //        missingPackages.push(passedPackage);
            //        this._logger.LogTrace(`package ${passedPackage} is not installed`);
            //    }
            //}
        }
        else {
            this._logger.LogTrace(`no packages have been passed, cannot upgrade`);

            return 1;
        }

        this._logger.LogTrace(`upgrade packages: ${upgradePackages.map(m => m.toString()).join('\n')}`);
        this._logger.LogTrace(`missing packages: ${missingPackages.map(m => m.toString()).join('\n')}`);
        this._logger.LogTrace(`ignored packages: ${ignoredPackages.map(m => m.toString()).join('\n')}`);

        if (missingPackages.length > 0) {
            return 1;
        }

        for (const i in upgradePackages) {
            //const foundPackage = upgradePackages[i];

            //const packageService = this._packageServiceFactory.GetInstance(foundPackage.Manager);

            //await packageService.UninstallPackage(foundPackage);
        }

        console.log(upgradePackages.map(m => m.toString()).join('\n'));

        this._logger.LogTrace(`upgrade finished`);

        return 0;
    }
};