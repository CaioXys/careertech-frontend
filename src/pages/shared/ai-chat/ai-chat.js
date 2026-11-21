export default {
  title: 'Assistente',
  html: '',

  mount() {
    document.dispatchEvent(new Event('careertech:assistant-open'));
  },
};
