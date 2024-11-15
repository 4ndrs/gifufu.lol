"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { FaFolderOpen } from "react-icons/fa";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import Button from "@/app/ui/button";

type OutputFile = {
  file: File;
  url: string;
};

const Encoder = () => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const [outputFile, setOutputFile] = useState<OutputFile>();
  const [isLoadingInput, setIsLoadingInput] = useState(false);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg>();

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

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    ffmpeg.on("log", (log) => console.log(log.message));

    setIsLoadingFFmpeg(true);

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    setIsLoadingFFmpeg(false);

    ffmpegRef.current = ffmpeg;

    return ffmpeg;
  };

  const handleFile = async (file: File) => {
    if (isEncoding || isLoadingFFmpeg) {
      return;
    }

    if (outputFile) {
      setOutputFile(undefined);
      URL.revokeObjectURL(outputFile.url);
    }

    const ffmpeg = await loadFFmpeg();

    setIsLoadingInput(true);

    const inputFileData = await fetchFile(file);
    const inputFileName = file.name;
    const outputFileName = inputFileName.replace(/\.[^/.]+$/, "") + ".gif";

    await ffmpeg.writeFile(inputFileName, inputFileData);

    const filters =
      "fps=50,mpdecimate=3,split[a][b],[a]palettegen[p],[b][p]paletteuse";

    const ffmpegParams = [
      "-hide_banner",
      "-i",
      file.name,
      "-lavfi",
      filters,
      outputFileName,
    ];

    setIsLoadingInput(false);

    const handleProgress = ({ progress }: { progress: number }) => {
      const progress_ = Math.trunc(progress * 100);

      setProgress(progress_ > 100 || progress_ < 0 ? 0 : progress_);
    };

    setIsEncoding(true);

    console.log("Encoding...");

    ffmpeg.on("progress", handleProgress);

    await ffmpeg.exec(ffmpegParams);

    ffmpeg.off("progress", handleProgress);

    setProgress(0);

    console.log("Done encoding.");

    setIsEncoding(false);

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

    // clear wasm files
    ffmpeg.deleteFile(inputFileName);
    ffmpeg.deleteFile(outputFileName);
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
        className="rounded-lg bg-gray-100 p-4 shadow-md"
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

          <Button disabled>View GIF</Button>
          <Button disabled>Re-encode</Button>

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
              handleFile(event.dataTransfer.files[0]);
            }}
            className="fixed inset-0 grid place-items-center rounded-lg bg-stone-100/70 p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <FaFolderOpen className="size-72 text-emerald-500" />
              <p className="text-4xl font-bold">Drop your file here~</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Spinner = () => (
  <div className="size-5 shrink-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
);

export default Encoder;
