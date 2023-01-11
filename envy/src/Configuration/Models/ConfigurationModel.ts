export class ConfigurationModel {
    constructor(data: any) {
        this.packageManagers = new PackageManagersConfigurationModel(data.packageManagers);
    }

    public packageManagers: PackageManagersConfigurationModel;
}

export class PackageManagersConfigurationModel {
    constructor(data: any) {
        this.chocolatey = new ChocolateyConfigurationModel(data.chocolatey);
    }

    public chocolatey: ChocolateyConfigurationModel;
}

export class ChocolateyConfigurationModel {
    constructor(data: any) {
        this.enabled = data.enabled;
        this.rootCommand = data.rootCommand;
        this.filterInstalledCommand = data.filterInstalledCommand;
        this.getInstalledPackageCommand = data.getInstalledPackageCommand;
        this.searchCommand = data.searchCommand;
        this.installCommand = data.installCommand;
        this.uninstallCommand = data.uninstallCommand;
        this.upgradeCommand = data.upgradeCommand;
        this.isInstalledCommand = data.isInstalledCommand;
        this.getExistingInstalledVersionCommand = data.getExistingInstalledVersionCommand;
        this.isPackageAvaiableForInstallCommand = data.isPackageAvaiableForInstallCommand;
    }

    public enabled: boolean;
    public rootCommand: string;
    public filterInstalledCommand: string;
    public getInstalledPackageCommand: string;
    public searchCommand: string;
    public installCommand: string;
    public uninstallCommand: string;
    public upgradeCommand: string;
    public isInstalledCommand: string;
    public getExistingInstalledVersionCommand: string;
    public isPackageAvaiableForInstallCommand: string;
}