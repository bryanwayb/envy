import { exec, ExecException } from 'child_process';
import { lstat } from 'fs/promises';
import { platform } from 'os';
import { join } from 'path';
import { Service } from 'typedi';

export enum OperatingSystem {
    Windows,
    Linux
};

@Service()
export default class ProcessService {
    GetOS(): OperatingSystem {
        switch (platform().toLowerCase()) {
            case 'win32':
                return OperatingSystem.Windows
            default:
                return OperatingSystem.Linux;
        }
    }

    async FindInPath(executable: string): Promise<string> {
        const os = this.GetOS();

        let paths = null;
        let pathExtensions = null;

        if (os === OperatingSystem.Windows) {
            paths = process.env.PATH.split(';');
            pathExtensions = (process.env.PATHEXT || '').split(';');
        }
        else {
            paths = process.env.PATH.split(':');
            pathExtensions = [];
        }

        for (const i in paths) {
            try {
                const search = join(paths[i], executable);
                await lstat(search);
                return search;
            }
            catch (ex) {
                for (const o in pathExtensions) {
                    try {
                        const extensionSearch = join(paths[i], `${executable}${pathExtensions[o]}`);
                        await lstat(extensionSearch);
                        return extensionSearch;
                    }
                    catch (ex) { continue; }
                }
            }
        }

        return null;
    }

    Execute(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error: ExecException, stdout: string, stderr: string) => {
                if (error) {
                    reject(new Error(error.toString()));
                }
                else {
                    // TODO: Allow stderr response
                    resolve(stdout);
                }
            });
        });
    }
};