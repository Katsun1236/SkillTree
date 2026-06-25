import React from 'react';

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  icon: Icon,
  type = "button",
  ...props 
}) {
  let baseStyle = "flex items-center justify-center gap-2 font-bold transition ";

  if (variant === 'primary') {
    baseStyle += "bg-black text-white px-6 py-3 rounded-xl hover:bg-slate-800 shadow-md ";
  } else if (variant === 'secondary') {
    baseStyle += "bg-slate-100 text-black px-6 py-3 rounded-xl hover:bg-slate-200 ";
  } else if (variant === 'outline') {
    baseStyle += "border-2 border-black text-black px-6 py-3 rounded-xl hover:bg-slate-50 ";
  } else if (variant === 'icon') {
    baseStyle = "p-2 hover:bg-slate-100 rounded-full transition flex items-center justify-center text-slate-600 hover:text-black ";
  }

  if (fullWidth) {
    baseStyle += "w-full ";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${className}`}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}