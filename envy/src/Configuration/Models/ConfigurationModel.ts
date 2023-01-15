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
        this.safeMode = data.safeMode;
        this.dryRun = data.dryRun;
        this.rootCommand = data.rootCommand;
        this.globalSwitches = data.globalSwitches;
        this.safeModeSearchSwitch = data.safeModeSearchSwitch;
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
    public safeMode: boolean;
    public dryRun: boolean;
    public rootCommand: string;
    public globalSwitches: string;
    public safeModeSearchSwitch: string;
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