import { exec, ExecException } from 'child_process';
import { lstat } from 'fs/promises';
import { platform } from 'os';
import { join } from 'path';
import { userInfo } from 'os';
import Container, { Service } from 'typedi';
import LoggerService, { LogLevel } from './LoggerService';

export enum EnumOperatingSystem {
    Windows,
    Linux
};

export interface ProcessStartOptions {
    Environment: {[key: string]: string}
}

@Service()
export default class ProcessService {
    private readonly _logger = Container.get(LoggerService).ScopeByType(ProcessService);

    private _isAdmin: boolean = null;

    GetOS(): EnumOperatingSystem {
        switch (platform().toLowerCase()) {
            case 'win32':
                return EnumOperatingSystem.Windows
            default:
                return EnumOperatingSystem.Linux;
        }
    }

    GetDistribution(): string {
        // TODO: Get OS distro
        return '';
    }

    GetUserHomeDirectory(): string {
        return userInfo().homedir;
    }

    async IsAdmin(): Promise<boolean> {
        if (this._isAdmin === null) {
            this._logger.LogTrace('checking if running as admin');
            switch (this.GetOS()) {
                case EnumOperatingSystem.Windows:
                    try {
                        await this.Execute('net session');
                        this._logger.LogTrace('process running as admin');
                        this._isAdmin = true;
                    }
                    catch (ex) {
                        this._logger.LogTrace('process not running as admin');
                        this._isAdmin = false;
                    }
                    break;
                default:
                    this._isAdmin = true;
                    break;
            }
        }

        return this._isAdmin;
    }

    GetEnvironment(): { [key: string]: string } {
        return process.env;
    }

    async FindInPath(executable: string): Promise<string> {
        const os = this.GetOS();

        let paths = null;
        let pathExtensions = null;

        if (os === EnumOperatingSystem.Windows) {
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

    async ExecutePowerShell(command: string): Promise<string> {
        const powerShellExecutable = await this.FindInPath('pwsh') || await this.FindInPath('powershell');

        if (powerShellExecutable === null) {
            return null;
        }

        return await this.Execute(`"${powerShellExecutable}" -ExecutionPolicy Bypass -NoLogo -c ${command}`);
    }

    Execute(command: string, options?: ProcessStartOptions, interactiveHandler?: (data: string) => string): Promise<string> {
        return new Promise((resolve, reject) => {
            this._logger.LogTrace(`executing command: ${command}`);
            const childProcess = exec(command, {
                    env: options ? options.Environment : null
                }, (error: ExecException, stdout: string, stderr: string) => {
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

            function streamHandler(chunk) {
                const result = interactiveHandler(chunk.toString());

                if (result) {
                    childProcess.stdin.write(result);
                }
            }

            if (interactiveHandler) {
                childProcess.stdout.on('data', streamHandler);
                childProcess.stderr.on('data', streamHandler);
            }

            if (this._logger.IsEnabled(LogLevel.Trace)) {
                childProcess.stdout.pipe(process.stdout);
                childProcess.stderr.pipe(process.stderr);
            }
        });
    }
};