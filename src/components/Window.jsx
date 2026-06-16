import { useState, useEffect } from "react";

function Window({
  title,
  children,
  top,
  left,
  width = "420px",
  height = "280px",
  onClose,
  onMinimize,
  zIndex,
  onFocus,
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

  const [maximized, setMaximized] =
    useState(false);

  const [savedPosition, setSavedPosition] =
    useState(null);

  const handleMouseDown = (e) => {
    if (maximized) return;

    setDragging(true);

    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });

    onFocus?.();
  };

  const handleMaximize = () => {
    if (!maximized) {
      setSavedPosition(position);
      setMaximized(true);
    } else {
      if (savedPosition) {
        setPosition(savedPosition);
      }

      setMaximized(false);
    }

    onFocus?.();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;

      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
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
      className="window"
      style={
        maximized
          ? {
              top: 0,
              left: 0,
              width: "100vw",
              height: "calc(100vh - 72px)",
              zIndex,
            }
          : {
              top: position.y,
              left: position.x,
              width,
              height,
              zIndex,
            }
      }
      onMouseDown={onFocus}
    >
      <div
        className="window-header"
        onMouseDown={handleMouseDown}
      >
        <div className="window-controls">
          <span
            className="close"
            onClick={onClose}
          ></span>

          <span
            className="minimize"
            onClick={onMinimize}
          ></span>

          <span
            className="maximize"
            onClick={handleMaximize}
          ></span>
        </div>

        <div className="window-title">
          {title}
        </div>
      </div>

      <div className="window-content">
        {children}
      </div>
    </div>
  );
}

export default Window;