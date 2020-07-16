export const setData = (formValues) => {
  localStorage.setItem('formValues', JSON.stringify(formValues));
};

export const getData = () => {
  const data = localStorage.getItem('formValues');

  return data ? JSON.parse(data) : {};
};
