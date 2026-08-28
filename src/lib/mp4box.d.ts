declare module 'mp4box' {
  export interface MP4Track {
    id: number;
    created: Date;
    modified: Date;
    volume: number;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    bitrate: number;
    codec: string;
    language: string;
    type: 'video' | 'audio' | string;
    video: {
      width: number;
      height: number;
    };
    samples?: any[];
  }

  export interface MP4Info {
    duration: number;
    timescale: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4Track[];
  }

  export interface MP4Sample {
    track_id: number;
    description: any;
    is_rap: boolean;
    is_sync: boolean;
    dts: number;
    cts: number;
    duration: number;
    timescale: number;
    size: number;
    data: ArrayBuffer;
  }

  export interface MP4File {
    onReady?: (info: MP4Info) => void;
    onError?: (e: string) => void;
    onSamples?: (id: number, user: any, samples: MP4Sample[]) => void;
    appendBuffer(data: ArrayBuffer): number;
    start(): void;
    stop(): void;
    flush(): void;
    setExtractionOptions(id: number, user?: any, options?: { nbSamples?: number; rapAlignment?: boolean }): void;
    getTrackSampleDescriptionEntry(track: MP4Track, sample: MP4Sample): any;
  }

  export class DataStream {
    static BIG_ENDIAN: boolean;
    static LITTLE_ENDIAN: boolean;
    constructor(buffer?: ArrayBuffer, offset?: number, endianness?: boolean);
    buffer: ArrayBuffer;
    write(stream: DataStream): void;
  }

  export function createFile(): MP4File;
  const mp4box: any;
  export default mp4box;
}
