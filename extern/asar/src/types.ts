export type FileData = NonNullable<ConstructorParameters<typeof Blob>[0]>[0] | ArrayBuffer

export interface UnpackedFiles {
  [key: string]: UnpackedFiles | FileData
}

export type UnpackedDirectory =  {
  files: { [property: string]:  FileData | UnpackedDirectory }
}

export interface FileMetadata {
  offset?: string
  size?: number
}

export type DirectoryMetadata =  {
  files: { [property: string]:  FileMetadata | DirectoryMetadata }
}

export type Metadata = DirectoryMetadata | FileMetadata
