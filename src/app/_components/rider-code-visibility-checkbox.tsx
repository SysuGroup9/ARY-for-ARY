"use client";

import { shouldConfirmHideRiderCode } from "@/lib/rider-code-visibility";

export function RiderCodeVisibilityCheckbox({
  defaultChecked,
  name,
}: {
  defaultChecked: boolean;
  name: string;
}) {
  return (
    <input
      defaultChecked={defaultChecked}
      name={name}
      type="checkbox"
      onChange={(event) => {
        if (
          shouldConfirmHideRiderCode({
            nextChecked: event.currentTarget.checked,
            wasPublic: defaultChecked,
          }) &&
          !confirm("取消勾选将永久清除已公开的 Rider 代码，确定吗？")
        ) {
          event.preventDefault();
          event.currentTarget.checked = true;
        }
      }}
    />
  );
}
