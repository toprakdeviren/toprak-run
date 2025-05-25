document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 {{PROJECT_NAME}} loaded successfully!');

  // Get started button functionality
  const getStartedBtn = document.getElementById('get-started-btn');
  getStartedBtn?.addEventListener('click', () => {
    alert('Welcome to {{PROJECT_NAME}}! Ready to build something amazing? 🎉');
  });
});
