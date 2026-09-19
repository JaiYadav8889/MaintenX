import type { SVGProps } from "react";

export interface MaintenxMarkProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

/**
 * MaintenX signature mark: a precision machine collar with a single amber
 * inspection gate. The open center keeps the silhouette legible at favicon
 * size while the gate carries the early-detection cue.
 */
export function MaintenxMark({ title = "MaintenX", ...props }: MaintenxMarkProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      role="img"
      aria-labelledby="maintenx-mark-title"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title id="maintenx-mark-title">{title}</title>
      <path
        d="M72 22h112c34.242 0 62 27.758 62 62v88c0 34.242-27.758 62-62 62H72c-34.242 0-62-27.758-62-62V84c0-34.242 27.758-62 62-62Z"
        fill="currentColor"
      />
      <path
        d="M72 44h112c22.091 0 40 17.909 40 40v88c0 22.091-17.909 40-40 40H72c-22.091 0-40-17.909-40-40V84c0-22.091 17.909-40 40-40Z"
        fill="#0E1824"
      />
      <path
        d="M128 69c32.585 0 59 26.415 59 59s-26.415 59-59 59-59-26.415-59-59 26.415-59 59-59Z"
        stroke="#334455"
        strokeWidth="14"
      />
      <path
        d="M128 76c28.719 0 52 23.281 52 52 0 11.855-3.967 22.783-10.647 31.52"
        stroke="#F2A900"
        strokeWidth="14"
        strokeLinecap="butt"
      />
      <path
        d="M128 102c14.359 0 26 11.641 26 26s-11.641 26-26 26-26-11.641-26-26 11.641-26 26-26Z"
        fill="#0E1824"
        stroke="#152333"
        strokeWidth="2"
      />
      <path
        d="M128 102v52M102 128h52"
        stroke="#2A3A4B"
        strokeWidth="5"
        strokeLinecap="square"
      />
      <path
        d="M128 102v26h26"
        stroke="#F2A900"
        strokeWidth="5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default MaintenxMark;
