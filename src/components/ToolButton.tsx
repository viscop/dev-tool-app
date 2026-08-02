type ToolButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function ToolButton({
  label,
  active,
  onClick,
}: ToolButtonProps) {
  const classes = active
    ? "rounded border bg-black px-3 py-2 text-white"
    : "rounded border px-3 py-2";

  return (
    <button
      className={classes}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default ToolButton;