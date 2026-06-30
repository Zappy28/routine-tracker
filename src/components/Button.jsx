function Button({ children, onClick, active = false, variant = "default" }) {
  return (
    <button
      className={`btn btn-${variant} ${active ? "btn-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;