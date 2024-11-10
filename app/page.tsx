"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { IoMdDownload } from "react-icons/io";
import { useRef, useState } from "react";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

import Image from "next/image";

type OutputFile = {
  file: File;
  url: string;
};

const Home = () => {
  const [isEncoding, setIsEncoding] = useState(false);
  const [outputFile, setOutputFile] = useState<OutputFile>();

  const inputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg>();

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    ffmpeg.on("log", (log) => console.log(log.message));

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    ffmpegRef.current = ffmpeg;

    return ffmpeg;
  };

  const handleFile = async (file: File) => {
    if (isEncoding) {
      console.warn("Already encoding.");
      return;
    }

    if (outputFile) {
      setOutputFile(undefined);
      URL.revokeObjectURL(outputFile.url);
    }

    const ffmpeg = await loadFFmpeg();
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

    setIsEncoding(true);

    console.log("Encoding...");

    await ffmpeg.exec(ffmpegParams);

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

  return (
    <main className="absolute inset-0 z-[-1] grid place-items-center">
      <div className="relative">
        {outputFile && (
          <div className="group absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full">
            <Image
              width={176}
              height={320}
              src={outputFile.url}
              alt={outputFile.file.name}
              className="max-h-80 max-w-44 object-cover"
            />

            <a
              href={outputFile.url}
              download={outputFile.file.name}
              className="absolute bottom-1 left-1 hidden cursor-pointer rounded-full p-3 hover:bg-emerald-200 group-hover:block"
            >
              <IoMdDownload className="size-5" />
            </a>
          </div>
        )}
        <button
          disabled={isEncoding}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-sm bg-emerald-500 px-4 py-2.5 text-white disabled:bg-gray-300 disabled:text-gray-500"
        >
          Select file
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
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
    </main>
  );
};

export default Home;
