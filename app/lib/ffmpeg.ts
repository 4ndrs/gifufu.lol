import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useEffect, useRef, useState } from "react";

export const useFFmpeg = () => {
  const [isLoading, setIsLoading] = useState(false);

  const ffmpegRef = useRef<FFmpeg>(undefined);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    ffmpeg.on("log", (log) => console.log(log.message));

    setIsLoading(true);

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    setIsLoading(false);

    ffmpegRef.current = ffmpeg;

    console.log("FFmpeg loaded.");

    return ffmpeg;
  };

  const terminateFFmpeg = () => {
    if (!ffmpegRef.current) {
      return;
    }

    ffmpegRef.current.terminate();
    ffmpegRef.current = undefined;

    console.log("FFmpeg terminated.");
  };

  return { isLoading, loadFFmpeg, terminateFFmpeg };
};

export const usePreview = (file: File) => {
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState<{ url: string; fileType: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const { loadFFmpeg, terminateFFmpeg } = useFFmpeg();

  useEffect(() => {
    let url: string;
    let cancelled = false;
    let ffmpeg: FFmpeg | undefined;

    const cleanup = () => {
      cancelled = true;

      setError(false);
      setPreview(undefined);

      URL.revokeObjectURL(url);

      terminateFFmpeg();
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
          console.log("cancelled after load");
          return;
        }

        const inputFileData = await fetchFile(file);
        const inputFileName = "preview-input-" + file.name;
        const outputFileName = file.name.replace(/\.[^/.]+$/, "") + ".mp4";

        setIsLoading(true);

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

        console.log("Generating preview...");

        await ffmpeg.exec(ffmpegParams);

        setIsLoading(false);

        if (cancelled) {
          console.log("cancelled after exec");

          return;
        }

        console.log("Done.");

        const outputData = await ffmpeg.readFile(outputFileName);

        const outputFile = new File([outputData], outputFileName, {
          type: "video/mp4",
        });

        const url = URL.createObjectURL(outputFile);

        console.log("Cleaning up preview wasm files...");

        ffmpeg.deleteFile(inputFileName);
        ffmpeg.deleteFile(outputFileName);

        console.log("preview URL:", url);

        setPreview({ url, fileType: "video/mp4" });
      } catch (error) {
        setError(true);
        setIsLoading(false);

        console.error(error);
      }
    })();

    return cleanup;
  }, [file, loadFFmpeg, terminateFFmpeg]);

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
