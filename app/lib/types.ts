export type TimeStamps = { startTime: number; endTime: number };

export type CropBox = { w: number; h: number; x: number; y: number };

export type HandleFileOptions = {
  height?: number;
  cropBox?: CropBox;
  timeStamps?: TimeStamps;
};
