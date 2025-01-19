import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useState } from "react";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg;
let loading: Promise<FFmpeg>;

const load = async () => {
  console.log("loading ffmpeg...");

  if (ffmpeg) {
    console.log("returning existing instance");
    return ffmpeg;
  }

  if (loading) {
    console.log("returning existing promise");
    return loading;
  }

  console.log("executing promise");
  loading = (async () => {
    console.log("inside the promise");
    const _ffmpeg = new FFmpeg();
    console.log("FFmpeg instance created");

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    _ffmpeg.on("log", (log) => console.log(log.message));

    console.log("loading core url...");

    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript",
    );

    console.log("loading wasm url...");

    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm",
    );

    console.log("running ffmpeg.load()...");

    await _ffmpeg.load({ coreURL, wasmURL });

    console.log("FFmpeg loaded.");

    ffmpeg = _ffmpeg;

    return _ffmpeg;
  })();

  return loading;
};

export const useFFmpeg = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadFFmpeg = async () => {
    setIsLoading(true);

    const ffmpeg = await load();

    setIsLoading(false);

    return ffmpeg;
  };

  return { isLoading, loadFFmpeg };
};

export const useSize = (file: File) => {
  const [size, setSize] = useState<{ width: number; height: number }>();

  const { loadFFmpeg } = useFFmpeg();

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      cancelled = true;
    };

    (async () => {
      try {
        const ffmpeg = await loadFFmpeg();

        if (cancelled) {
          console.log("[useSize]: cancelled after load");
          return;
        }

        const inputFileData = await fetchFile(file);
        const inputFileName = "size-input-" + file.name;

        await ffmpeg.writeFile(inputFileName, inputFileData);

        const ffmpegParams = ["-hide_banner", "-i", inputFileName];

        const handleLog = ({ message }: { message: string }) => {
          const match = message.match(/Video:.*?(\d{2,})x(\d{2,})/);

          if (match) {
            const width = parseInt(match[1], 10);
            const height = parseInt(match[2], 10);

            setSize({ width, height });
          }
        };

        ffmpeg.on("log", handleLog);

        await ffmpeg.exec(ffmpegParams);

        ffmpeg.off("log", handleLog);

        ffmpeg.deleteFile(inputFileName);
      } catch (error) {
        console.error("error while getting video size:", error);
      }
    })();

    return cleanup;
  }, [file, loadFFmpeg]);

  return size;
};

export const usePreview = (file: File) => {
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState<{ url: string; fileType: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const { loadFFmpeg } = useFFmpeg();

  useEffect(() => {
    let url: string;
    let cancelled = false;
    let ffmpeg: FFmpeg | undefined;

    const cleanup = () => {
      cancelled = true;

      setError(false);
      setPreview(undefined);

      URL.revokeObjectURL(url);
    };

    // if it's a compatible format, just use their file URL
    // this doesn't check for compatible codecs/pixel formats, but it's good enough for now
    if (["video/mp4", "video/webm"].includes(file.type)) {
      url = URL.createObjectURL(file);

      setPreview({ url, fileType: file.type });

      return cleanup;
    }

    (async () => {
      try {
        setIsLoading(true);

        ffmpeg = await loadFFmpeg();

        setIsLoading(false);

        if (cancelled) {
          console.log("[usePreview]: cancelled after load");
          return;
        }

        setIsLoading(true);

        console.log("[usePreview]: loading the file...");

        const inputFileData = await fetchFile(file);
        const inputFileName = "preview-input-" + file.name;
        const outputFileName = file.name.replace(/\.[^/.]+$/, "") + ".mp4";

        await ffmpeg.writeFile(inputFileName, inputFileData);

        const filters = "scale=-2:580:flags=lanczos";

        const ffmpegParams = [
          "-hide_banner",
          "-i",
          inputFileName,
          "-c:v",
          "libx264",
          "-crf",
          "35",
          "-preset",
          "ultrafast",
          "-an",
          "-pix_fmt",
          "yuv420p",
          "-lavfi",
          filters,
          outputFileName,
        ];

        console.log("[usePreview]: Generating preview...");

        await ffmpeg.exec(ffmpegParams);

        setIsLoading(false);

        console.log("Done.");

        const outputData = await ffmpeg.readFile(outputFileName);

        const outputFile = new File([outputData], outputFileName, {
          type: "video/mp4",
        });

        const url = URL.createObjectURL(outputFile);

        console.log("[usePreview]: Cleaning up preview wasm files...");

        ffmpeg.deleteFile(inputFileName);
        ffmpeg.deleteFile(outputFileName);

        console.log("[usePreview]: preview URL:", url);

        setPreview({ url, fileType: "video/mp4" });
      } catch (error) {
        setError(true);
        setIsLoading(false);

        console.error(error);
      }
    })();

    return cleanup;
  }, [file, loadFFmpeg]);

  return { preview, error, isLoading };
};

export const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis
    .toString()
    .padStart(3, "0")}`;
};
