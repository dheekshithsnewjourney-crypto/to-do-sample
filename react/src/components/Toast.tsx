interface Props {
  message: string;
  onUndo: () => void;
}

export default function Toast({ message, onUndo }: Props) {
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onUndo}>Undo</button>
    </div>
  );
}
