const versionStringRegex = new RegExp('^((.*?):)?(.*?)(@(.*))?$');

export class PackageModel {
    public Manager: string;

    public Name: string;

    public Version: string;

    public HasManager(): boolean {
        return this.Manager !== null
            && this.Manager !== undefined
            && this.Manager.trim().length > 0;
    }

    public HasName(): boolean {
        return this.Name !== null
            && this.Name !== undefined
            && this.Name.trim().length > 0;
    }

    public HasVersion(): boolean {
        return this.Version !== null
            && this.Version !== undefined
            && this.Version.trim().length > 0;
    }

    //public Description: string;

    public static Parse(input: string): PackageModel {
        if (input) {
            const ret = new PackageModel();

            const matches = input.match(versionStringRegex);

            ret.Manager = matches[2];
            ret.Name = matches[3];
            ret.Version = matches[5];

            return ret;
        }

        return null;
    }

    public toString(): string {
        return `${this.HasManager() ? `${this.Manager}:` : ''}${this.HasName() ? `${this.Name}` : ''}${this.HasVersion() ? `@${this.Version}` : ''}`;
    }
}