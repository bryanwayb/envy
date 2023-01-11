import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_UninstallCommand } from '../../consts';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';

@Service(DI_ICommandHandler_UninstallCommand)
export default class UninstallCommand extends BaseCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        this._logger.LogTrace(`preparing to uninstall packages`);

        const foundPackages = new Array<PackageModel>();
        const missingPackages = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();
        if (passedPackages.length > 0) {
            for (const i in passedPackages) {
                const passedPackage = passedPackages[i];

                await this.EnsurePackageHasManager(passedPackage);

                const packageService = this._packageServiceFactory.GetInstance(passedPackage.Manager);

                const installedPackage = await packageService.GetInstalledPackage(passedPackage);

                if (installedPackage) {
                    this._logger.LogTrace(`package ${installedPackage} is installed`);
                    foundPackages.push(installedPackage);
                }
                else {
                    missingPackages.push(passedPackage);
                    this._logger.LogTrace(`package ${passedPackage} is not installed`);
                }
            }
        }
        else {
            this._logger.LogTrace(`no packages have been passed, cannot uninstall`);

            return 1;
        }

        this._logger.LogTrace(`found packages to uninstall: ${foundPackages.map(m => m.toString()).join('\n')}`);
        this._logger.LogTrace(`missing packages: ${missingPackages.map(m => m.toString()).join('\n')}`);

        if (missingPackages.length > 0) {
            return 1;
        }

        for (const i in foundPackages) {
            const foundPackage = foundPackages[i];

            const packageService = this._packageServiceFactory.GetInstance(foundPackage.Manager);

            await packageService.UninstallPackage(foundPackage);
        }

        console.log(foundPackages.map(m => m.toString()).join('\n'));

        this._logger.LogTrace(`uninstall finished`);

        return 0;
    }
};