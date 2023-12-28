import { Buffer } from 'filer'

// sizeof(T).
export const SIZE_INT32 = 4
export const SIZE_UINT32 = 4
export const SIZE_INT64 = 8
export const SIZE_UINT64 = 8
export const SIZE_FLOAT = 4
export const SIZE_DOUBLE = 8

// The allocation granularity of the payload.
export const PAYLOAD_UNIT = 64

// Largest JS number.
export const CAPACITY_READ_ONLY = 9007199254740992

// Aligns 'i' by rounding it up to the next multiple of 'alignment'.
export const alignInt = (i: number, alignment: number) => i + (alignment - (i % alignment)) % alignment

// PickleIterator reads data from a Pickle. The Pickle object must remain valid
// while the PickleIterator object is in use.
class PickleIterator {
  payload: any
  payloadOffset: number
  readIndex: number
  endIndex: number

  constructor (pickle: Pickle) {
    this.payload = pickle.header
    this.payloadOffset = pickle.headerSize
    this.readIndex = 0
    this.endIndex = pickle.getPayloadSize()
  }

  readBool () {
    return this.readInt() !== 0
  }

  readInt () {
    return this.readBytes(SIZE_INT32, Buffer.prototype.readInt32LE)
  }

  readUInt32 () {
    return this.readBytes(SIZE_UINT32, Buffer.prototype.readUInt32LE)
  }

  readInt64 () {
    throw new Error('Int64 not supported in the browser')
  }

  readUInt64 () {
    throw new Error('UInt64 not supported in the browser')
  }

  readFloat () {
    return this.readBytes(SIZE_FLOAT, Buffer.prototype.readFloatLE)
  }

  readDouble () {
    return this.readBytes(SIZE_DOUBLE, Buffer.prototype.readDoubleLE)
  }

  readString () {
    return this.readBytes(this.readInt()).toString()
  }

  readBytes (length: number, method?: Function) {
    var readPayloadOffset = this.getReadPayloadOffsetAndAdvance(length)
    if (method != null) {
      return method.call(this.payload, readPayloadOffset, length)
    } else {
      return this.payload.slice(readPayloadOffset, readPayloadOffset + length)
    }
  }

  getReadPayloadOffsetAndAdvance (length: number) {
    if (length > this.endIndex - this.readIndex) {
      this.readIndex = this.endIndex
      throw new Error('Failed to read data with length of ' + length)
    }
    var readPayloadOffset = this.payloadOffset + this.readIndex
    this.advance(length)
    return readPayloadOffset
  }

  advance (size: number) {
    var alignedSize = alignInt(size, SIZE_UINT32)
    if (this.endIndex - this.readIndex < alignedSize) {
      this.readIndex = this.endIndex
    } else {
      this.readIndex += alignedSize
    }
  }
}


// This class provides facilities for basic binary value packing and unpacking.
//
// The Pickle class supports appending primitive values (ints, strings, etc.)
// to a pickle instance.  The Pickle instance grows its internal memory buffer
// dynamically to hold the sequence of primitive values.   The internal memory
// buffer is exposed as the "data" of the Pickle.  This "data" can be passed
// to a Pickle object to initialize it for reading.
//
// When reading from a Pickle object, it is important for the consumer to know
// what value types to read and in what order to read them as the Pickle does
// not keep track of the type of data written to it.
//
// The Pickle's data has a header which contains the size of the Pickle's
// payload.  It can optionally support additional space in the header.  That
// space is controlled by the header_size parameter passed to the Pickle
// constructor.
export default class Pickle {
  header: Buffer
  headerSize: number
  capacityAfterHeader: number
  writeOffset: number

  constructor (buffer?: Buffer) {
    if (buffer) {
      this.header = buffer
      this.headerSize = buffer.length - this.getPayloadSize()
      this.capacityAfterHeader = CAPACITY_READ_ONLY
      this.writeOffset = 0
      if (this.headerSize > buffer.length) {
        this.headerSize = 0
      }
      if (this.headerSize !== alignInt(this.headerSize, SIZE_UINT32)) {
        this.headerSize = 0
      }
      if (this.headerSize === 0) {
        this.header = new Buffer(0)
      }
    } else {
      this.header = new Buffer(0)
      this.headerSize = SIZE_UINT32
      this.capacityAfterHeader = 0
      this.writeOffset = 0
      this.resize(PAYLOAD_UNIT)
      this.setPayloadSize(0)
    }
  }

  createIterator () {
    return new PickleIterator(this)
  }

  toBuffer () {
    return this.header.slice(0, this.headerSize + this.getPayloadSize())
  }

  writeBool (value: any) {
    return this.writeInt(value ? 1 : 0)
  }

  writeInt (value: any) {
    return this.writeBytes(value, SIZE_INT32, Buffer.prototype.writeInt32LE)
  }

  writeUInt32 (value: any) {
    return this.writeBytes(value, SIZE_UINT32, Buffer.prototype.writeUInt32LE)
  }

  writeInt64 () {
    throw new Error('Int64 not supported in the browser')
  }

  writeUInt64 () {
    throw new Error('UInt64 not supported in the browser')
  }

  writeFloat (value: any) {
    return this.writeBytes(value, SIZE_FLOAT, Buffer.prototype.writeFloatLE)
  }

  writeDouble (value: any) {
    return this.writeBytes(value, SIZE_DOUBLE, Buffer.prototype.writeDoubleLE)
  }

  writeString (value: string) {
    var length = Buffer.byteLength(value, 'utf8')
    if (!this.writeInt(length)) {
      return false
    }
    return this.writeBytes(value, length)
  }

  setPayloadSize (payloadSize: number) {
    return this.header.writeUInt32LE(payloadSize, 0)
  }

  getPayloadSize () {
    return this.header.readUInt32LE(0)
  }

  writeBytes (data: any, length: number, method?: Function) {
    var dataLength = alignInt(length, SIZE_UINT32)
    var newSize = this.writeOffset + dataLength
    if (newSize > this.capacityAfterHeader) {
      this.resize(Math.max(this.capacityAfterHeader * 2, newSize))
    }
    if (method != null) {
      method.call(this.header, data, this.headerSize + this.writeOffset)
    } else {
      this.header.write(data, this.headerSize + this.writeOffset, length)
    }
    var endOffset = this.headerSize + this.writeOffset + length
    this.header.fill(0, endOffset, endOffset + dataLength - length)
    this.setPayloadSize(newSize)
    this.writeOffset = newSize
    return true
  }

  resize (newCapacity: number) {
    newCapacity = alignInt(newCapacity, PAYLOAD_UNIT)
    this.header = Buffer.concat([this.header, new Buffer(newCapacity)])
    this.capacityAfterHeader = newCapacity
  }
}

export const createEmpty = () => new Pickle()

export const createFromBuffer = (buffer: Buffer) => new Pickle(buffer)
