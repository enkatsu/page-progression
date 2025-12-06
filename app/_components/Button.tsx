"use client";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      className="bg-linear-to-l from-[#FD6F00] via-[#FF2C62] to-[#6842FF] py-3 px-12 rounded-[88px] text-2xl font-extrabold leading-none tracking-[0.05em] cursor-pointer hover:opacity-90 active:scale-95 transition-all"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
