import { FaTimes } from "react-icons/fa";

import * as Dialog from "@radix-ui/react-dialog";

interface Props extends React.ComponentProps<typeof Dialog.Trigger> {
  fileUrl: string;
  fileName: string;
}

const Viewer = ({ children, fileUrl, fileName, ...props }: Props) => (
  <Dialog.Root>
    <Dialog.Trigger {...props}>{children}</Dialog.Trigger>

    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 grid place-items-center bg-black/25">
        <Dialog.Content>
          <Dialog.Title className="sr-only">{fileName}</Dialog.Title>
          <Dialog.Description className="sr-only">
            GIF preview
          </Dialog.Description>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt="generated gif preview"
            className="max-h-full max-w-full"
          />

          <Dialog.Close
            aria-label="close gif preview"
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-black/50 p-2 text-white"
          >
            <FaTimes size={16} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
);

export default Viewer;
