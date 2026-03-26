import toast from 'react-hot-toast';

export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: '#0B0B0B',
      color: '#00FF88',
      border: '1px solid #00FF88',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

export const toastError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    style: {
      background: '#0B0B0B',
      color: '#FF6B00',
      border: '1px solid #FF6B00',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

export const toastLoading = (message: string) => {
  toast.loading(message, {
    style: {
      background: '#0B0B0B',
      color: '#00FF88',
      border: '1px solid #00FF88',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

export const dismissToast = () => {
  toast.dismiss();
};
