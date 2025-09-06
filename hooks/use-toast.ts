import { toast } from "sonner";
export { toast };

export const useToast = () => {
  return {
    toast: {
      success: (message: string, description?: string) =>
        toast.success(message, description ? { description } : undefined),

      error: (message: string, description?: string) =>
        toast.error(message, description ? { description } : undefined),

      warning: (message: string, description?: string) =>
        toast.warning(message, description ? { description } : undefined),

      info: (message: string, description?: string) =>
        toast.info(message, description ? { description } : undefined),

      default: (message: string, description?: string) =>
        toast(message, description ? { description } : undefined),

      promise: toast.promise,
      dismiss: toast.dismiss,
      loading: (message: string) => toast.loading(message),
    },
  };
};
