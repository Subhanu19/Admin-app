import Toast from 'react-native-toast-message';

export const toast = {
  // Success messages
  success: (message, description = '') => {
    Toast.show({
      type: 'success',
      text1: message,
      text2: description,
      position: 'top',
      visibilityTime: 4000,
    });
  },

  // Error messages
  error: (message, description = '') => {
    Toast.show({
      type: 'error',
      text1: message,
      text2: description,
      position: 'top',
      visibilityTime: 5000,
    });
  },

  // Info messages
  info: (message, description = '') => {
    Toast.show({
      type: 'info',
      text1: message,
      text2: description,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  // Warning messages
  warning: (message, description = '') => {
    Toast.show({
      type: 'warning',
      text1: message,
      text2: description,
      position: 'top',
      visibilityTime: 4000,
    });
  },

  // Hide current toast
  hide: () => {
    Toast.hide();
  },
};