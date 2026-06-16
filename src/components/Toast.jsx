import { useEffect } from "react";

function Toast({
  title,
  message,
  onClose,
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification">
  <div className="notification-header">
    <strong>{title}</strong>
  </div>

  <div className="notification-message">
    {message}
  </div>

  <div className="notification-progress" />
</div>
    
  );
}

export default Toast;