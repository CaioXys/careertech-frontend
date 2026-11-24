import html from './ai-chat.html?raw';

export default {
  title: 'Chat',
  html,

  mount(root) {
    const messages = root.querySelector('[data-chat-messages]');
    const form = root.querySelector('[data-chat-form]');
    const input = root.querySelector('[data-chat-input]');

    const scrollToLatest = () => {
      messages.scrollTop = messages.scrollHeight;
    };

    const appendMessage = (text, type) => {
      const message = document.createElement('p');
      message.className = `ai-chat-page__message ai-chat-page__message--${type}`;
      message.textContent = text;
      messages.append(message);
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        input.value = '';
        return;
      }

      appendMessage(text, 'student');
      input.value = '';

      const thinking = document.createElement('p');
      thinking.className = 'ai-chat-page__thinking';
      thinking.setAttribute('role', 'status');
      thinking.textContent = 'Pensando…';
      messages.append(thinking);
      scrollToLatest();
      input.focus();
    };

    form.addEventListener('submit', handleSubmit);
    scrollToLatest();

    return () => form.removeEventListener('submit', handleSubmit);
  },
};
