document.addEventListener('DOMContentLoaded', (): void => {
  console.log('🚀 {{PROJECT_NAME}} loaded successfully!');

  // Get started button functionality
  const getStartedBtn = document.getElementById('get-started-btn') as HTMLButtonElement;
  getStartedBtn?.addEventListener('click', (): void => {
    alert('Welcome to {{PROJECT_NAME}}! Ready to build something amazing? 🎉');
  });
});
