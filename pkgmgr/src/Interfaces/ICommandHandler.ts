export interface ICommandHandler {
    Execute(): Promise<number>;
};