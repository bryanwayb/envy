export class ConfigurationModel {
    public packageManagers: PackageManagersConfigurationModel;
}

export class PackageManagersConfigurationModel {
    public chocolatey: ChocolateyConfigurationModel;
}

export class ChocolateyConfigurationModel {
    public enabled: boolean;
    public rootCommand: string;
    public filterInstalledCommand: string;
    public getInstalledPackageCommand: string;
    public searchCommand: string;
    public installCommand: string;
    public uninstallCommand: string;
    public isInstalledCommand: string;
    public getExistingInstalledVersionCommand: string;
    public isPackageAvaiableForInstallCommand: string;
}