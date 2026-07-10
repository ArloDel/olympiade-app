import { AlertTriangle, X, CheckCircle, Info } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDark?: boolean;
  type?: "danger" | "warning" | "info" | "success";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  isDark = false,
  type = "warning"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      bg: "bg-rose-500/10",
      text: "text-rose-500",
      btn: "bg-rose-600 hover:bg-rose-700",
      icon: <AlertTriangle size={24} />
    },
    warning: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      btn: "bg-amber-600 hover:bg-amber-700",
      icon: <AlertTriangle size={24} />
    },
    info: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      btn: "bg-blue-600 hover:bg-blue-700",
      icon: <Info size={24} />
    },
    success: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      btn: "bg-emerald-600 hover:bg-emerald-700",
      icon: <CheckCircle size={24} />
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className={`relative w-full max-w-sm p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${isDark ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100'}`}
        >
          <X size={16} />
        </button>
        <div className="flex flex-col items-center text-center gap-4 mt-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bg} ${config.text}`}>
            {config.icon}
          </div>
          <div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {description}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-4">
            <button 
              onClick={onClose}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-sm ${config.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
