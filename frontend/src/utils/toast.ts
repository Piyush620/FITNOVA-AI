import toast from 'react-hot-toast';

export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: 'linear-gradient(180deg, rgba(22,25,43,0.96) 0%, rgba(15,18,31,0.98) 100%)',
      color: '#8ef7c7',
      border: '1px solid rgba(142,247,199,0.45)',
      borderRadius: '18px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
    },
  });
};

export const toastError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    style: {
      background: 'linear-gradient(180deg, rgba(32,20,33,0.96) 0%, rgba(22,15,27,0.98) 100%)',
      color: '#ffb5d3',
      border: '1px solid rgba(255,181,211,0.45)',
      borderRadius: '18px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
    },
  });
};

export const toastLoading = (message: string) => {
  toast.loading(message, {
    style: {
      background: 'linear-gradient(180deg, rgba(22,25,43,0.96) 0%, rgba(15,18,31,0.98) 100%)',
      color: '#8ef7c7',
      border: '1px solid rgba(142,247,199,0.45)',
      borderRadius: '18px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
    },
  });
};

export const dismissToast = () => {
  toast.dismiss();
};
