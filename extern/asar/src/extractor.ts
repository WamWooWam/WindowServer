import type { FileData, DirectoryMetadata, FileMetadata, Metadata } from './types'

import { Path } from 'filer'

import { isDirectoryMetadata } from './utils'

const path = Path

export type FullFileMetadata = Omit<FileMetadata, 'offset'> & { offset: number, path: string, fileOffset: number }

export interface ListPackageMetadataReturn {
  [key: string]: FullFileMetadata | ListPackageMetadataReturn
}

type ListChildMetadataOptions<T extends boolean> = {
  basePath: string
  metadata:
  T extends true
  ? DirectoryMetadata
  : DirectoryMetadata | FileMetadata
  filesOffset: number
}
const flatListChildMetadata = ({ basePath, metadata, filesOffset }: ListChildMetadataOptions<true>): FullFileMetadata[] =>
  Object
    .entries(metadata.files)
    .flatMap(([key, value]) =>
      isDirectoryMetadata(value)
        ? flatListChildMetadata({ basePath: path.join(basePath, key), metadata: value, filesOffset })
        : ({
          path: path.join(basePath, key),
          offset: Number((metadata.files[key] as FileMetadata).offset),
          size: (metadata.files[key] as FileMetadata).size,
          fileOffset: filesOffset + 8 + Number((metadata.files[key] as FileMetadata).offset)
        })
    )

export type ListChildsNestedMetadataReturnType<T> = T extends DirectoryMetadata ? ListPackageMetadataReturn : FullFileMetadata[]
const listChildsNestedMetadata = <T extends DirectoryMetadata | FileMetadata>({ basePath, metadata, filesOffset }: ListChildMetadataOptions<false>): ListChildsNestedMetadataReturnType<T> =>
  isDirectoryMetadata(metadata)
    ? (
      Object.fromEntries(
        Object
          .entries(metadata.files)
          .map(([key, value]) => [
            key,
            listChildsNestedMetadata({ basePath: path.join(basePath, key), metadata: value, filesOffset })
          ])
      )
    ) as ListChildsNestedMetadataReturnType<T>
    : ({
      path: basePath,
      offset: Number(metadata.offset),
      size: metadata.size,
      fileOffset: filesOffset + 8 + metadata.offset!
    }) as unknown as ListChildsNestedMetadataReturnType<T>

const listChilds = <T extends boolean>(
  { flat, header, filesOffset }:
    { flat: T, header: T extends true ? DirectoryMetadata : DirectoryMetadata | FileMetadata, filesOffset: number }
) =>
  flat
    ? flatListChildMetadata({ metadata: header as DirectoryMetadata, basePath: '/', filesOffset })
    : listChildsNestedMetadata({ metadata: header, basePath: '/', filesOffset })

const searchNodeFromDirectory = (header: Metadata, p: string) => {
  let json = header
  const dirs = p.split(path.sep)
  for (const dir of dirs) {
    if (dir !== '.') {
      json = (<DirectoryMetadata>json).files[dir]
    }
  }
  return json
}

const searchNodeFromPath = (header: DirectoryMetadata, p: string) => {
  p = p.replace(/^\//, '')
  if (!p) { return header }
  const name = path.basename(p)
  const node = <DirectoryMetadata>searchNodeFromDirectory(header, path.dirname(p))
  if (node.files === null) {
    node.files = {}
  }
  if (node.files[name] === null) {
    node.files[name] = {}
  }
  return node.files[name]
}

export const readArchiveHeaderSync = (archiveArrayBuffer: ArrayBuffer): { header: DirectoryMetadata, headerSize: number } => {
  const size = new DataView(archiveArrayBuffer).getUint32(4, true)
  const headerSize = new DataView(archiveArrayBuffer.slice(8, 16)).getInt32(4, true)
  const header = new TextDecoder('utf-8').decode(archiveArrayBuffer.slice(16, 16 + headerSize))
  return {
    header: JSON.parse(header),
    headerSize: size
  }
}

const getArrayBuffer = (data: FileData) =>
  data instanceof ArrayBuffer ? Promise.resolve(data)
    : new Blob([data]).arrayBuffer()

export const extractFile = async (archive: FileData, pathname: string) => {
  const buffer = await getArrayBuffer(archive)
  const size = new DataView(buffer).getUint32(4, true)
  const headerSize = new DataView(buffer).getUint32(12, true)
  const headerBuffer = buffer.slice(16, headerSize + 16)
  const headerString = new TextDecoder('utf-8').decode(headerBuffer)
  const header = JSON.parse(headerString)
  const { offset, size: payloadSize } = <FileMetadata>searchNodeFromPath(header, pathname)
  console.log('headerSize', size, headerSize)
  console.log('offset', offset, payloadSize)
  return buffer.slice(size + Number(offset) + 8, size + Number(offset) + payloadSize! + 8)
}

export type ListPackageOptions = {
  flat?: boolean
}
export type AsarHeader<T = false> = {
  headerSize: number
  header:
  T extends true
  ? FullFileMetadata[]
  : ListPackageMetadataReturn
}

const makeAsarHeader = <T extends boolean>(headerSize: number, filesOffset: number, buffers: Uint8Array[], flat: T) =>
  new Blob(buffers)
    .arrayBuffer()
    .then(arrayBuffer => {
      const headerString =
        new TextDecoder('utf-8')
          .decode(new Uint8Array(arrayBuffer, 16, headerSize))
      const header = JSON.parse(headerString)

      return {
        headerSize,
        filesOffset,
        header: listChilds({ flat, header, filesOffset })
      }
    })

export const getHeader =
  async <T extends ListPackageOptions>(bodyInit: BodyInit, options?: T): Promise<AsarHeader<T['flat']>> => {
    const reader = new Response(bodyInit).body!.getReader()

    const read = async (i = 0, headerSize?: number, filesOffset?: number, buffers: Uint8Array[] = []): Promise<any> => {
      if (headerSize && i >= headerSize) {
        await reader.cancel()
        return makeAsarHeader(headerSize, filesOffset!, buffers, options?.flat!)
      }

      const { value, done } = await reader.read()

      if (done) return makeAsarHeader(headerSize!, filesOffset!, buffers, options?.flat!)

      return read(
        i + value.byteLength,
        i + value.byteLength >= 16
          ? headerSize ?? new DataView(value.buffer, 8, 16).getInt32(4, true)
          : undefined,
        i + value.byteLength >= 16
          ? headerSize ?? new DataView(value.buffer).getUint32(4, true)
          : undefined,
        [...buffers, value]
      )
    }
    return read()
  }

interface extractPackageReturn {
  [key: string]: FileData | extractPackageReturn
}

export const extractAll =
  async <T extends ListPackageOptions>(
    archive: FileData,
    options?: T
  ): Promise<{ [key: string]: FileData } | extractPackageReturn> => {
    const buffer = await getArrayBuffer(archive)
    const { header } = await getHeader(buffer, { flat: options?.flat })

    if (options?.flat) {
      return Object.fromEntries(
        await Promise.all(
          ((header as FullFileMetadata[]).map(({ path }) => path))
            .map(async (path: string) => [
              path,
              await extractFile(buffer, path)
            ])
        )
      )
    }

    const extractFolder = async (folder: ListPackageMetadataReturn): Promise<extractPackageReturn> =>
      Object.fromEntries(
        await Promise.all(
          Object
            .entries(folder)
            .map(async ([key, value]) => [
              key,
              typeof value === 'object'
                ? await extractFolder(value as ListPackageMetadataReturn)
                : await extractFile(buffer, value)
            ])
        )
      )

    return extractFolder(header as ListPackageMetadataReturn)
  }
