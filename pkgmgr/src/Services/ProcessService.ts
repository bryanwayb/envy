import { exec, ExecException } from 'child_process';
import { lstat } from 'fs/promises';
import { platform } from 'os';
import { join } from 'path';
import Container, { Service } from 'typedi';
import LoggerService from './LoggerService';

export enum OperatingSystem {
    Windows,
    Linux
};

@Service()
export default class ProcessService {
    private readonly _logger = Container.get(LoggerService).ScopeByType(ProcessService);

    GetOS(): OperatingSystem {
        switch (platform().toLowerCase()) {
            case 'win32':
                return OperatingSystem.Windows
            default:
                return OperatingSystem.Linux;
        }
    }

    async IsAdmin(): Promise<boolean> {
        this._logger.LogTrace('checking if running as admin');
        switch (this.GetOS()) {
            case OperatingSystem.Windows:
                try {
                    await this.Execute('net session');
                    this._logger.LogTrace('process running as admin');
                }
                catch (ex) {
                    this._logger.LogTrace('process not running as admin');
                    return false;
                }
                return true;
            default:
                return true;
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
            this._logger.LogTrace(`executing command: ${command}`);
            exec(command, (error: ExecException, stdout: string, stderr: string) => {
                this._logger.LogTrace(`command results: ${command}
Error: ${error}
stderr: ${stderr}
stdout: ${stdout}`);
                if (error) {
                    reject(error);
                }
                else {
                    // TODO: Allow stderr response
                    resolve(stdout);
                }
            });
        });
    }
};