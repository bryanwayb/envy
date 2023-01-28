export enum PackageContextEnum {
    System,
    User,
    Directory
}

export class PackageServiceOptions {
    public Context: PackageContextEnum = PackageContextEnum.System;
    public Directory: string = null;

    public Equals(a: PackageServiceOptions, b: PackageServiceOptions): boolean {
        if (a.Context !== b.Context) {
            return false;
        }

        if (a.Context === PackageContextEnum.Directory
            && a.Directory !== b.Directory) {
            return false;
        }

        return true;
    }

    public GetContextAsString() {
        if (this.Context === PackageContextEnum.System) {
            return 'system';
        }
        else if (this.Context === PackageContextEnum.User) {
            return 'user';
        }
        else {
            return this.Directory;
        }
    }
}