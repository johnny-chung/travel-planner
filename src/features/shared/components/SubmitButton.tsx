"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = ComponentProps<typeof Button> & {
  pendingLabel?: ReactNode;
};

export default function SubmitButton({
  children,
  pendingLabel,
  disabled,
  type = "submit",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type={type} disabled={disabled || pending} {...props}>
      {pending ? pendingLabel ?? children : children}
    </Button>
  );
}
