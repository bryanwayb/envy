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
        return this.install && this.install.trim() !== '';
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

export class ApplyTargetModel {
    constructor(data: any) {
        this.os = data.os;
        this.distributions = data.distributions;

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

    public os: string;
    public distributions: string[];
    public operations: ApplyOperationModel[];
    public sections: ApplySectionModel[];

    public Validate(): string[] {
        const validationErrors: string[] = [];

        if (!this.operations || this.operations.length === 0) {
            validationErrors.push('target is missing operations');
        }

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

export class ApplySectionModel {
    constructor(data: any) {
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

    public name: string;
    public targets: ApplyTargetModel[];
    public sections: ApplySectionModel[];

    public Validate(): string[] {
        const validationErrors: string[] = [];

        if (this.targets) {
            for (const i in this.targets) {
                const target = this.targets[i];
                validationErrors.push(...target.Validate());
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