function DesktopIcon({
  icon,
  label,
  top,
  left,
  onDoubleClick,
}) {
  return (
    <div
      className="desktop-icon"
      style={{
        top,
        left,
      }}
      onDoubleClick={onDoubleClick}
    >
      <div className="icon-wrapper">
        {icon}
      </div>

      <span>{label}</span>
    </div>
  );
}

export default DesktopIcon;