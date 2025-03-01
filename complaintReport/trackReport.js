document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Set up form submission
    const trackForm = document.getElementById('track-form');
    const trackError = document.getElementById('track-error');
    
    trackForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const reportId = document.getElementById('report-id').value.trim();
      
      if (!reportId) {
        showError('Please enter a report ID.');
        return;
      }
      
      // Check if the report exists
      const complaint = getComplaintById(reportId);
      
      if (complaint) {
        // Redirect to the report detail page
        window.location.href = `report-detail.html?id=${reportId}`;
      } else {
        showError('Report not found. Please check the ID and try again.');
      }
    });
    
    // Show error message
    function showError(message) {
      trackError.textContent = message;
      trackError.classList.remove('hidden');
      
      // Hide the error after 5 seconds
      setTimeout(() => {
        trackError.classList.add('hidden');
      }, 5000);
    }
    
    // Get complaint by ID
    function getComplaintById(id) {
      const store = getComplaintStore();
      return store.complaints.find(complaint => complaint.id === id);
    }
    
    // Get data from localStorage
    function getComplaintStore() {
      try {
        const storedData = localStorage.getItem('safetyComplaintData');
        if (storedData) {
          return JSON.parse(storedData);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
      
      return {
        complaints: [],
        statusUpdates: []
      };
    }
    
    // Resource links handler
    const resourceLinks = document.querySelectorAll('#resources-link, #resources-footer');
    resourceLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Resources page is not implemented in this demo.');
      });
    });
  });