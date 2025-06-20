export const validateName = (text: string): boolean => {
  return /^[a-zA-Z\s]{0,30}$/.test(text);
};

export const validateUsername = (text: string): boolean => {
  return /^[a-zA-Z0-9]{0,20}$/.test(text);
};

export const validateBio = (text: string): boolean => {
  return text.length <= 150;
};
