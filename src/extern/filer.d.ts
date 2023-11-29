export const Path: typeof import('node:path')

type Flags = 'FORMAT' | 'NOCTIME' | 'NOMTIME';
type Options = {
    name?: string,
    flags?: Flags[],
    provider?: any // i really am not arsed to type this
};

interface FileSystem {
    new(options?: Options, callback?: Function): typeof import('node:fs');
}

export const FileSystem: FileSystem;
export const Buffer: typeof import('node:buffer').Buffer;