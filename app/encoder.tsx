"use client";

import { toast } from "sonner";
import { fetchFile } from "@ffmpeg/util";
import { FaFolderOpen } from "react-icons/fa";
import { formatTime, useFFmpeg } from "@/app/lib/ffmpeg";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import Button from "@/app/ui/button";
import Viewer from "@/app/ui/viewer";
import VideoEditor from "@/app/ui/video-editor";
import useSettingsStore from "@/app/lib/store";

import type { HandleFileOptions, TimeStamps } from "@/app/lib/types";

type OutputFile = {
  file: File;
  url: string;
};

const Encoder = () => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const [outputFile, setOutputFile] = useState<OutputFile>();
  const [timeStamps, setTimeStamps] = useState<TimeStamps>();
  const [lastInputFile, setLastInputFile] = useState<File>();
  const [isLoadingInput, setIsLoadingInput] = useState(false);
  const [videoEditorIsOpen, setVideoEditorIsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortEncodingRef = useRef(false);

  const { isLoading: isLoadingFFmpeg, loadFFmpeg } = useFFmpeg();
  const {
    fps,
    height: settingsHeight,
    mpdecimate,
    videoEditorIsEnabled,
  } = useSettingsStore();

  useEffect(() => {
    // listen for dragging events on the whole document
    const handleDragEnter = (event: DragEvent) => {
      setIsDragging(true);
      event.preventDefault();
    };

    const handleDragOver = (event: DragEvent) => {
      setIsDragging(true);
      event.preventDefault();
    };

    const handleDragLeave = (event: DragEvent) => {
      setIsDragging(false);
      event.preventDefault();
    };

    const handleDrop = (event: DragEvent) => {
      setIsDragging(false);
      event.preventDefault();
    };

    document.addEventListener("drop", handleDrop);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);

    return () => {
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
    };
  }, []);

  const handleFile = async (file: File, options?: HandleFileOptions) => {
    const { cropBox, timeStamps } = options || {};

    const height = options?.height
      ? options.height == -1 // no scale
        ? undefined
        : options.height
      : settingsHeight;

    if (isEncoding || isLoadingFFmpeg) {
      return;
    }

    setLastInputFile(file);

    if (outputFile) {
      setOutputFile(undefined);
      URL.revokeObjectURL(outputFile.url);
    }

    if (!timeStamps && videoEditorIsEnabled) {
      setTimeStamps(undefined);
      setVideoEditorIsOpen(true);
      return;
    }

    try {
      const ffmpeg = await loadFFmpeg();

      setIsLoadingInput(true);

      const inputFileData = await fetchFile(file);
      const inputFileName = "input-" + file.name;
      const outputFileName = file.name.replace(/\.[^/.]+$/, "") + ".gif";

      await ffmpeg.writeFile(inputFileName, inputFileData);

      const fpsFilter = fps ? `fps=${fps},` : "";
      const scaleFilter = height ? `scale=-1:${height},` : "";
      const mpdecimateFilter = mpdecimate ? `mpdecimate=${mpdecimate},` : "";

      const cropFilter = cropBox
        ? `crop=${cropBox.w}:${cropBox.h}:${cropBox.x}:${cropBox.y},`
        : "";

      const filters = `${fpsFilter}${cropFilter}${scaleFilter}${mpdecimateFilter}split[a][b],[a]palettegen[p],[b][p]paletteuse`;

      const endTime =
        videoEditorIsEnabled && timeStamps?.endTime
          ? ["-to", formatTime(timeStamps.endTime)]
          : [];

      const startTime =
        videoEditorIsEnabled && timeStamps?.startTime
          ? ["-ss", formatTime(timeStamps.startTime)]
          : [];

      const ffmpegParams = [
        "-hide_banner",
        ...endTime,
        ...startTime,
        "-i",
        inputFileName,
        "-lavfi",
        filters,
        outputFileName,
      ];

      console.log("FFmpeg command: ffmpeg", ffmpegParams.join(" "));

      setIsLoadingInput(false);

      const cleanWasmFiles = () => {
        console.log("Cleaning up wasm files...");
        ffmpeg.deleteFile(inputFileName);
        ffmpeg.deleteFile(outputFileName);
      };

      const handleProgress = ({ progress }: { progress: number }) => {
        const progress_ = Math.trunc(progress * 100);

        setProgress(progress_ > 100 || progress_ < 0 ? 0 : progress_);
      };

      const handleLogErrors = ({ message }: { message: string }) => {
        if (message.includes("Error while")) {
          toast.error(message);
          console.error(message);

          abortEncodingRef.current = true;

          ffmpeg.off("log", handleLogErrors);
        }
      };

      setIsEncoding(true);

      console.log("Encoding...");

      ffmpeg.on("log", handleLogErrors);
      ffmpeg.on("progress", handleProgress);

      await ffmpeg.exec(ffmpegParams);

      ffmpeg.off("log", handleLogErrors);
      ffmpeg.off("progress", handleProgress);

      setProgress(0);
      setIsEncoding(false);

      if (abortEncodingRef.current) {
        cleanWasmFiles();

        console.warn("Encoding aborted.");

        abortEncodingRef.current = false;

        return;
      }

      console.log("Done encoding.");

      const outputData = await ffmpeg.readFile(outputFileName);

      const outputFile_ = new File([outputData], outputFileName, {
        type: "image/gif",
      });

      const url = URL.createObjectURL(outputFile_);

      console.log("Output URL:", url);

      setOutputFile({
        url,
        file: outputFile_,
      });

      cleanWasmFiles();
    } catch (error) {
      console.error(error);

      toast.error("Failed to encode the file. Please try again.");

      setIsEncoding(false);
      setIsLoadingInput(false);
    }
  };

  const commonProps = {
    className: "flex gap-2 items-center font-bold",
    exit: { y: 50, scale: 0.8, opacity: 0 },
    animate: { y: 0, scale: 1, opacity: 1 },
    initial: { y: -50, scale: 0.8, opacity: 0 },
    transition: { duration: 0.6, ease: "easeInOut" },
  } satisfies React.ComponentProps<typeof motion.div>;

  let content = (
    <motion.div key="select-file" {...commonProps}>
      <Button onClick={() => inputRef.current?.click()}>Select file</Button>
    </motion.div>
  );

  if (isLoadingFFmpeg) {
    content = (
      <motion.div key="loading-ffmpeg" {...commonProps}>
        <Spinner />
        Gathering all the GIF magic… This will be worth the wait, senpai! 💕
      </motion.div>
    );
  }

  if (isLoadingInput) {
    content = (
      <motion.div key="loading-input" {...commonProps}>
        <Spinner />
        Loading your file… Please wait, senpai! 💕
      </motion.div>
    );
  }

  if (isEncoding) {
    content = (
      <motion.div key="encoding" {...commonProps}>
        <Spinner />
        Gifufu magic is working~ {progress}% and counting! ✨
      </motion.div>
    );
  }

  if (outputFile) {
    content = (
      <motion.div
        key="output-file"
        {...commonProps}
        className="rounded-lg bg-gray-100 p-4 shadow-md dark:bg-gray-800"
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold">Encoded File Information</h3>
          <p className="text-sm">
            <strong>Name:</strong> {outputFile.file.name}
          </p>
          <p className="text-sm">
            <strong>Size:</strong>{" "}
            {`${(outputFile.file.size / 1024).toFixed(2)} KB`}
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <Button link href={outputFile.url} download={outputFile.file.name}>
            Download GIF
          </Button>

          <Viewer
            asChild
            fileUrl={outputFile.url}
            fileName={outputFile.file.name}
          >
            <Button>View GIF</Button>
          </Viewer>

          <Button
            disabled={!lastInputFile}
            onClick={() => {
              if (!lastInputFile) {
                return;
              }

              if (videoEditorIsEnabled) {
                setVideoEditorIsOpen(true);
              } else {
                handleFile(lastInputFile);
              }
            }}
          >
            Re-encode
          </Button>

          <Button onClick={() => inputRef.current?.click()}>
            Select Another File
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mb-0 mt-auto">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={isEncoding || isLoadingFFmpeg}
        onChange={({ target }) => {
          const file = target.files?.[0];

          if (!file) {
            console.warn("No file selected.");
            return;
          }

          handleFile(file);

          target.value = "";
        }}
      />

      <AnimatePresence mode="wait">{content}</AnimatePresence>

      <AnimatePresence>
        {isDragging && (
          <motion.div
            key="dragging"
            exit={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            onDrop={(event) => {
              setIsDragging(false);
              const file = event.dataTransfer.files[0];

              if (!file) {
                toast.error("No file dropped.");
                return;
              }

              handleFile(file);
            }}
            className="fixed inset-0 grid place-items-center rounded-lg bg-stone-100/70 p-4 dark:bg-black/70"
          >
            <div className="flex flex-col items-center gap-2">
              <FaFolderOpen className="size-72 text-emerald-500" />
              <p className="text-4xl font-bold">Drop your file here~</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {lastInputFile && videoEditorIsEnabled && (
        <VideoEditor
          key={lastInputFile.name}
          file={lastInputFile}
          open={videoEditorIsOpen}
          timeStamps={timeStamps}
          onSubmit={(options) => {
            setTimeStamps(options.timeStamps);
            setVideoEditorIsOpen(false);

            handleFile(lastInputFile, options);
          }}
          onOpenChange={setVideoEditorIsOpen}
        />
      )}
    </div>
  );
};

const Spinner = () => (
  <div className="size-5 shrink-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
);

export default Encoder;
