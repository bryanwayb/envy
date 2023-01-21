import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_UpgradeCommand } from '../../consts';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';

@Service(DI_ICommandHandler_UpgradeCommand)
export default class UpgradeCommand extends BaseCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        this._logger.LogTrace(`preparing to upgrade packages`);

        const upgradePackages: { [packageVersion: string]: PackageModel } = {};
        const installPackages = new Array<PackageModel>();
        const missingPackages = new Array<PackageModel>();
        const ignoredPackages = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();
        if (passedPackages.length > 0) {
            for (const i in passedPackages) {
                const passedPackage = passedPackages[i];

                // TODO: This throws an error, but we want to collect missing packages, fix this
                await this.EnsurePackageHasManager(passedPackage);

                const packageService = this._packageServiceFactory.GetInstance(passedPackage.Manager);

                this._logger.LogTrace(`checking if ${passedPackage} exists in package manager`);
                const availablePackage = await packageService.GetPackageAvaiableForInstall(passedPackage);
                if (availablePackage === null) {
                    this._logger.LogTrace(`${passedPackage} does not exist in package manager`);
                    missingPackages.push(passedPackage);
                }
                else {
                    const packageWithoutVersion = new PackageModel(passedPackage);
                    packageWithoutVersion.Version = null;
                    const installedPackage = await packageService.GetInstalledPackage(packageWithoutVersion);

                    if (installedPackage) {
                        if (installedPackage.Version === availablePackage.Version) {
                            this._logger.LogTrace(`${installedPackage} is already at the requested version, ignoring`);
                            ignoredPackages.push(installedPackage);
                        }
                        else {
                            this._logger.LogTrace(`${availablePackage} exists in package manager, upgrading from ${installedPackage} to ${availablePackage}`);
                            upgradePackages[installedPackage.toString()] = availablePackage;
                        }
                    }
                    else {
                        this._logger.LogTrace(`package ${availablePackage} is not installed, will install`);
                        installPackages.push(availablePackage);
                    }
                }
            }
        }
        else {
            this._logger.LogTrace(`no packages have been passed, cannot upgrade`);

            return 1;
        }

        this._logger.LogTrace(`upgrade packages: ${Object.keys(upgradePackages).map(m => `${m} --> ${upgradePackages[m].toString()}`).join('\n')}`);
        this._logger.LogTrace(`install packages: ${installPackages.map(m => m.toString()).join('\n')}`);
        this._logger.LogTrace(`missing packages: ${missingPackages.map(m => m.toString()).join('\n')}`);
        this._logger.LogTrace(`ignored packages: ${ignoredPackages.map(m => m.toString()).join('\n')}`);

        if (missingPackages.length > 0) {
            return 1;
        }

        for (const i in installPackages) {
            const installPackage = installPackages[i];
            this.AddRequiredPackageManager(installPackage.Manager);
        }

        for (const i in upgradePackages) {
            const upgradePackage = upgradePackages[i];
            this.AddRequiredPackageManager(upgradePackage.Manager);
        }

        if (!await this.PreparePackageManagers()) {
            return 1;
        }

        for (const i in installPackages) {
            const installPackage = installPackages[i];
            const packageService = this._packageServiceFactory.GetInstance(installPackage.Manager);

            await packageService.InstallPackage(installPackage);
        }

        for (const i in upgradePackages) {
            const upgradePackage = upgradePackages[i];
            const packageService = this._packageServiceFactory.GetInstance(upgradePackage.Manager);

            await packageService.UpgradePackage(upgradePackage);
        }

        console.log('installed packages', installPackages.map(m => m.toString()).join('\n'));
        console.log('upgraded packages', Object.keys(upgradePackages).map(m => `${m} --> ${upgradePackages[m].toString()}`).join('\n'));

        this._logger.LogTrace(`upgrade finished`);

        return 0;
    }
};