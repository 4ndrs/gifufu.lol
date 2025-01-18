"use client";

import {
  FaCrop,
  FaTimes,
  FaCropAlt,
  FaCaretUp,
  FaPlayCircle,
  FaPauseCircle,
} from "react-icons/fa";

import { Mosaic } from "react-loading-indicators";
import { usePreview, useSize } from "@/app/lib/ffmpeg";
import { useRef, useState } from "react";

import Button from "@/app/ui/button";
import Cropper from "@/app/ui/video-editor/cropper";

import * as Dialog from "@radix-ui/react-dialog";

import type { CropBox, TimeStamps } from "@/app/lib/types";

type Props = {
  open: boolean;
  file: File;
  onSubmit: (timeStamps: TimeStamps, cropBox?: CropBox) => void;
  timeStamps: TimeStamps | undefined;
  onOpenChange: (open: boolean) => void;
};

const VideoEditor = ({
  open,
  file,
  onSubmit,
  timeStamps,
  onOpenChange,
}: Props) => {
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [cropIsActive, setCropIsActive] = useState(false);

  const [cropSize, setCropSize] = useState({
    width: 96,
    height: 96,
  });

  const [cropPosition, setCropPosition] = useState({
    top: 0,
    left: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const wasPlayingRef = useRef(isPlaying);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastSeekUpdateRef = useRef(Date.now());

  const videoSize = useSize(file);

  const { preview, error, isLoading } = usePreview(file);

  const handleCaretPointerDown = (type: "start-time" | "end-time") => {
    if (!progressBarRef.current || isLoading || error) {
      return;
    }

    wasPlayingRef.current = isPlaying;

    videoRef.current?.pause();

    const progressBarElement = progressBarRef.current;

    let time: number;

    setIsDragging(true);

    const handlePointerMove = (event: PointerEvent) => {
      if (!videoRef.current) {
        return;
      }

      const rect = progressBarElement.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;

      if (type === "start-time") {
        time = Math.max(0, Math.min(endTime, duration * percent));
        setStartTime(time);
      } else {
        time = Math.max(startTime, Math.min(duration, duration * percent));
        setEndTime(time);
      }

      const now = Date.now();

      // Seek only every 80 milliseconds
      if (now - lastSeekUpdateRef.current > 80) {
        videoRef.current.currentTime = time;

        lastSeekUpdateRef.current = now;
      }
    };

    const handlePointerUp = () => {
      if (wasPlayingRef.current && videoRef.current) {
        videoRef.current.play();
        videoRef.current.currentTime = type === "start-time" ? time : startTime;
      }

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);

      setIsDragging(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 z-[1] bg-black/60 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />

      <Dialog.Content className="fixed inset-x-0 bottom-0 z-[1] flex max-h-[80vh] flex-col bg-white px-5 py-10 data-[state=closed]:animate-slide-down data-[state=open]:animate-slide-up lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[min(70rem,95vh)] lg:max-w-[min(58rem,80vw)] lg:rounded-md lg:px-10 lg:py-16 lg:data-[state=closed]:animate-scale-out lg:data-[state=open]:animate-scale-in dark:bg-gray-900">
        <Dialog.Close
          aria-label="close video editor"
          className="absolute right-4 top-4 cursor-pointer rounded-full"
        >
          <FaTimes size={16} />
        </Dialog.Close>

        <Dialog.Title className="sr-only mb-4 text-lg font-medium uppercase">
          Video Editor
        </Dialog.Title>

        <Dialog.Description className="sr-only">
          Edit your video
        </Dialog.Description>

        <div
          data-playing={isPlaying}
          className="group flex h-full flex-col gap-4 overflow-hidden rounded-xl"
        >
          {isLoading && (
            <div className="flex flex-col items-center self-center [&>span]:flex [&>span]:flex-col [&>span]:items-center">
              <Mosaic text="generating preview" size="large" color="#10b981" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-4 self-center">
              <p className="text-red-500">Error reading the file</p>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          )}
          {preview && (
            <div className="relative flex flex-col overflow-y-auto rounded-xl">
              <video
                muted
                autoPlay
                controls={false}
                playsInline={true}
                className="rounded-xl"
                onContextMenu={(event) => event.preventDefault()}
                ref={(videoElement) => {
                  if (!videoElement) {
                    return;
                  }

                  videoRef.current = videoElement;

                  videoElement.onplay = () => setIsPlaying(true);
                  videoElement.onpause = () => setIsPlaying(false);

                  videoElement.onloadedmetadata = () => {
                    const endTime =
                      timeStamps?.endTime ?? videoElement.duration;
                    const startTime = timeStamps?.startTime ?? 0;

                    setEndTime(endTime);
                    setStartTime(startTime);
                    setCurrentTime(startTime);

                    videoElement.currentTime = startTime;

                    setDuration(videoElement.duration);
                  };

                  videoElement.ontimeupdate = () => {
                    setCurrentTime(videoElement.currentTime);

                    if (
                      !videoElement.paused &&
                      videoElement.currentTime >= endTime
                    ) {
                      videoElement.currentTime = startTime;
                    }
                  };

                  videoElement.onended = () => {
                    if (isDragging) {
                      return;
                    }

                    videoElement.currentTime = startTime;
                    videoElement.play();
                  };

                  return () => {
                    // clean up
                    videoElement.onplay = null;
                    videoElement.onpause = null;
                    videoElement.onended = null;
                    videoElement.ontimeupdate = null;
                    videoElement.onloadedmetadata = null;

                    videoRef.current = null;
                  };
                }}
              >
                <source src={preview.url} type={preview.fileType} />
                Your browser does not support the video tag.
              </video>

              {cropIsActive && (
                <Cropper
                  size={cropSize}
                  videoRef={videoRef}
                  position={cropPosition}
                  onSizeChange={(size) => setCropSize(size)}
                  onPositionChange={(position) => setCropPosition(position)}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-6 rounded-xl bg-gray-100 p-4 lg:gap-10 lg:p-10 dark:bg-gray-700">
            <div
              ref={progressBarRef}
              style={
                {
                  "--end-time-percent": (endTime / duration) * 100 + "%",
                  "--start-time-percent": (startTime / duration) * 100 + "%",
                  "--current-time-percent":
                    (currentTime / duration) * 100 + "%",
                } as React.CSSProperties
              }
              className="relative h-1 rounded-full bg-emerald-500"
            >
              <div className="absolute inset-y-0 left-0 w-[var(--start-time-percent)] rounded-l-full bg-emerald-300 dark:bg-emerald-800" />
              <div className="absolute inset-y-0 left-[var(--end-time-percent)] right-0 rounded-r-full bg-emerald-300 dark:bg-emerald-800" />
              <FaCaretUp
                onPointerDown={() => handleCaretPointerDown("start-time")}
                className="absolute left-[var(--start-time-percent)] top-0 size-5 -translate-x-1/2 cursor-pointer text-emerald-500 lg:size-8"
              />
              <FaCaretUp
                onPointerDown={() => handleCaretPointerDown("end-time")}
                className="absolute left-[var(--end-time-percent)] top-0 size-5 -translate-x-1/2 cursor-pointer text-emerald-500 lg:size-8"
              />

              <div className="absolute -inset-y-1 left-[var(--current-time-percent)] w-px bg-gray-700 dark:bg-white" />
            </div>

            <div className="relative self-center">
              <button
                disabled={isLoading || !preview || error}
                className="rounded-full"
                aria-label={(isPlaying ? "pause" : "play") + " video"}
                onClick={() => {
                  if (!videoRef.current) {
                    return;
                  }

                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                }}
              >
                <FaPlayCircle className="hidden size-16 text-emerald-500 group-data-[playing=false]:block lg:size-20" />
                <FaPauseCircle className="hidden size-16 text-emerald-500 group-data-[playing=true]:block lg:size-20" />
              </button>

              <button
                title={
                  cropIsActive
                    ? "disable cropping mode"
                    : "enable cropping mode"
                }
                aria-label={
                  cropIsActive
                    ? "disable cropping mode"
                    : "enable cropping mode"
                }
                onClick={() => setCropIsActive(!cropIsActive)}
                className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full rounded-full bg-emerald-500 p-2 text-gray-100 dark:text-gray-700"
              >
                {cropIsActive ? <FaCrop size={20} /> : <FaCropAlt size={20} />}
              </button>
            </div>
          </div>
        </div>

        <Button
          disabled={error}
          className="mt-4"
          onClick={() => {
            if (!videoRef.current) {
              return;
            }

            if (!videoSize) {
              console.error("video size is not available");
              return;
            }

            const videoElement = videoRef.current;

            const rect = videoElement.getBoundingClientRect();

            const containerWidth = rect.width;
            const containerHeight = rect.height;

            const scaleX = videoSize.width / containerWidth;
            const scaleY = videoSize.height / containerHeight;

            const w = Math.round(cropSize.width * scaleX);
            const h = Math.round(cropSize.height * scaleY);
            const y = Math.round(cropPosition.top * scaleY);
            const x = Math.round(cropPosition.left * scaleX);

            const cropBox = { w, h, x, y };
            const timeStamps = { endTime, startTime };

            console.log(
              "containerWidth",
              containerWidth,
              "\ncontainerHeight",
              containerHeight,
              "\n\nffmpeg video width",
              videoSize.width,
              "\nffmpeg video height",
              videoSize.height,
              "\n\nvideo element width",
              videoElement.videoWidth,
              "\nvideo element height",
              videoElement.videoHeight,
            );

            onSubmit(timeStamps, cropIsActive ? cropBox : undefined);
          }}
        >
          Continue
        </Button>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default VideoEditor;
