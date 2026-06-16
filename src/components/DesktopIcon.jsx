import { useState, useEffect } from "react";

function DesktopIcon({
  icon,
  label,
  top,
  left,
  onDoubleClick,
}) {
  const [position, setPosition] = useState({
    x: parseInt(left),
    y: parseInt(top),
  });

  const [dragging, setDragging] =
    useState(false);

  const [offset, setOffset] =
    useState({
      x: 0,
      y: 0,
    });

  const handleMouseDown = (e) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    setDragging(true);

    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;

      setPosition({
        x: Math.max(
          0,
          e.clientX - offset.x
        ),
        y: Math.max(
          0,
          e.clientY - offset.y
        ),
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    document.addEventListener(
      "mousemove",
      handleMouseMove
    );

    document.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      document.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, [dragging, offset]);

  return (
    <div
      className="desktop-icon"
      style={{
        position: "absolute",
        top: `${position.y}px`,
        left: `${position.x}px`,
        userSelect: "none",
        cursor: dragging
          ? "grabbing"
          : "grab",
      }}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

export default DesktopIcon;