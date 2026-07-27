import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "../Button/Button.tsx";
import { Modal } from "./Modal.tsx";
import type { ModalProps } from "./Modal.tsx";

const meta: Meta<ModalProps> = {
  title: "Primitives/Modal",
  component: Modal,
  args: {
    children: "Modal content belongs to the consuming application.",
    isOpen: true,
    onClose: fn(),
    title: "Dialog title",
  },
  argTypes: {
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<ModalProps>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    children: (
      <>
        <p>Confirm or dismiss this action.</p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <Button variant="text">Cancel</Button>
          <Button variant="text">Confirm</Button>
        </div>
      </>
    ),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};
