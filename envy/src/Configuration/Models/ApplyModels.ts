import { PackageModel } from "../../PackageServices/Models/PackageModel";
import { PackageContextEnum } from "../../PackageServices/Models/PackageServiceOptions";
import { EnumOperatingSystem } from "../../Services/ProcessService";

export enum EnumTargetOS {
    Windows = 'windows',
    Linux = 'linux'
}

export class ApplyOperationModel {
    constructor(data: any) {
        this.install = PackageModel.Parse(data.install);
        this.uninstall = PackageModel.Parse(data.uninstall);
    }

    public install: PackageModel = null;
    public uninstall: PackageModel = null;

    public Validate(): string[] {
        const validationErrors: string[] = [];

        if (this.install !== null
            && this.uninstall !== null) {
            validationErrors.push(`only a single action can be specified, install = ${this.install}, uninstall = ${this.uninstall}`);
        }
        if (this.install === null
            && this.uninstall === null) {
            validationErrors.push('an action was not specified');
        }

        if (this.install !== null
            && !this.install.HasManager()) {
            validationErrors.push(`install action with package ${this.install.Name} did not specify a manager`);
        }

        if (this.uninstall !== null
            && !this.uninstall.HasManager()) {
            validationErrors.push(`uninstall action with package ${this.install.Name} did not specify a manager`);
        }

        return validationErrors;
    }
}

abstract class SectionAndTargetBase {
    public operations: ApplyOperationModel[];
    public sections: ApplySectionModel[];

    constructor(data: any) {
        if (data.operations) {
            this.operations = [];
            for (const i in data.operations) {
                const operation = data.operations[i];

                if (operation) {
                    const entry = new ApplyOperationModel(operation);
                    this.operations.push(entry);
                }
            }
        }

        if (data.sections) {
            this.sections = [];
            for (const i in data.sections) {
                const section = data.sections[i];

                if (section) {
                    const entry = new ApplySectionModel(section);
                    this.sections.push(entry);
                }
            }
        }
    }

    public Validate(): string[] {
        const validationErrors: string[] = [];

        if (this.operations) {
            for (const i in this.operations) {
                const operation = this.operations[i];
                validationErrors.push(...operation.Validate());
            }
        }

        if (this.sections) {
            for (const i in this.sections) {
                const section = this.sections[i];
                validationErrors.push(...section.Validate());
            }
        }

        return validationErrors;
    }
}

export class ApplyTargetModel extends SectionAndTargetBase {
    constructor(data: any) {
        super(data);

        if (data.os
            && typeof data.os == 'string') {
            this.os = data.os.toLowerCase();
        }
        this.distributions = data.distributions;
        this.context = data.context;
    }

    public os: EnumTargetOS;
    public distributions: string[];
    public context: string;

    public HasContext(): boolean {
        return this.context && this.context.trim() !== '';
    }

    public GetContext(): PackageContextEnum {
        if (this.HasContext()) {
            switch (this.context.trim().toLowerCase()) {
                case '':
                case 'system':
                    return PackageContextEnum.System;
                case 'user':
                    return PackageContextEnum.User;
                default:
                    return PackageContextEnum.Directory;
            }
        }

        return PackageContextEnum.System;
    }

    public GetContextDirectory(): string {
        if (this.GetContext() === PackageContextEnum.Directory) {
            return this.context;
        }

        return null;
    }

    public Validate(): string[] {
        const validationErrors: string[] = [];

        // TODO: Perform distro and OS setting validation

        if (!this.os) {
            validationErrors.push('target is missing an OS');
        }

        if (!this.operations || this.operations.length === 0) {
            validationErrors.push('target is missing operations');
        }

        validationErrors.push(...super.Validate());

        return validationErrors;
    }

    public CanTargetOS(os: EnumOperatingSystem): boolean {
        if (os === EnumOperatingSystem.Windows) {
            return this.os === EnumTargetOS.Windows;
        }
        else if (os === EnumOperatingSystem.Linux) {
            return this.os === EnumTargetOS.Linux;
        }

        return false; // Default to no match since OS is required
    }

    public CanTargetDistro(distro: string): boolean {
        if (distro
            && this.distributions
            && this.distributions.length > 0) {
            const lowerDistro = distro.toLowerCase();

            for (const i in this.distributions) {
                const distribution = this.distributions[i];

                if (distribution.toLowerCase() === lowerDistro) {
                    return true;
                }
            }

            return false;
        }

        return true;
    }
}

export class ApplySectionModel extends SectionAndTargetBase {
    constructor(data: any) {
        super(data);

        this.name = data.name;
        if (data.targets) {
            this.targets = [];
            for (const i in data.targets) {
                const target = data.targets[i];

                if (target) {
                    const entry = new ApplyTargetModel(target);
                    this.targets.push(entry);
                }
            }
        }
    }

    public name: string;
    public targets: ApplyTargetModel[];

    public Validate(): string[] {
        const validationErrors: string[] = [];

        if (this.targets) {
            for (const i in this.targets) {
                const target = this.targets[i];
                validationErrors.push(...target.Validate());
            }
        }

        validationErrors.push(...super.Validate());

        return validationErrors;
    }
}

export class ApplyRootModel extends ApplySectionModel {
    constructor(data: any) {
        super(data);

        this.name = 'root';
    }
}