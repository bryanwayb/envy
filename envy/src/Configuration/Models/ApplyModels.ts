export class ApplyOperationModel {
    constructor(data: any) {
        this.install = data.install;
        this.uninstall = data.uninstall;
    }

    public install: string;
    public uninstall: string;

    public HasInstall(): boolean {
        return this.install && this.install.trim() !== '';
    }

    public HasUninstall(): boolean {
        return this.uninstall && this.uninstall.trim() !== '';
    }

    public Validate(): string[] {
        const validationErrors: string[] = [];

        if (this.HasInstall()
            && this.HasUninstall()) {
            validationErrors.push(`only a single action can be specified, install = ${this.install}, uninstall = ${this.uninstall}`);
        }
        if (!(this.HasInstall() || this.HasUninstall())) {
            validationErrors.push('an action was not specified');
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

        this.os = data.os;
        this.distributions = data.distributions;
    }

    public os: string;
    public distributions: string[];

    public Validate(): string[] {
        const validationErrors: string[] = [];

        // TODO: Perform distro and OS setting validation

        if (!this.operations || this.operations.length === 0) {
            validationErrors.push('target is missing operations');
        }

        validationErrors.push(...super.Validate());

        return validationErrors;
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