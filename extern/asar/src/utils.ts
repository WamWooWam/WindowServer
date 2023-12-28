import type { DirectoryMetadata, FileMetadata } from './types'

export const isDirectory = (val: any) => !!val && typeof val === 'object'

export const isDirectoryMetadata =
  (val: DirectoryMetadata | FileMetadata): val is DirectoryMetadata =>
    isDirectory(val) &&
    isDirectory((<DirectoryMetadata>val).files)
