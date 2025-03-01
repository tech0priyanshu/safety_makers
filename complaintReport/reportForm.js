document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Form elements
    const form = document.getElementById('safety-form');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const continueBtn = document.getElementById('continue-btn');
    const backBtn = document.getElementById('back-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formTitle = document.getElementById('form-title');
    const progressBar = document.getElementById('progress-bar');
    const stepIndicator = document.getElementById('step-indicator');
    const step1Icon = document.getElementById('step1-icon');
    const step2Icon = document.getElementById('step2-icon');
    
    // Set up event listeners
    continueBtn.addEventListener('click', moveToStep2);
    backBtn.addEventListener('click', moveToStep1);
    form.addEventListener('submit', handleSubmit);
    
    // Helper function to validate first step
    function validateStep1() {
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      
      if (!firstName || !lastName || !email) {
        alert('Please fill in your name and email address to continue.');
        return false;
      }
      
      // Basic email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        return false;
      }
      
      return true;
    }
    
    // Move to step 2
    function moveToStep2() {
      if (!validateStep1()) return;
      
      step1.classList.remove('active');
      step2.classList.add('active');
      formTitle.textContent = 'Incident Details';
      progressBar.style.width = '100%';
      stepIndicator.textContent = 'Step 2 of 2';
      step1Icon.classList.add('hidden');
      step2Icon.classList.remove('hidden');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Move back to step 1
    function moveToStep1() {
      step2.classList.remove('active');
      step1.classList.add('active');
      formTitle.textContent = 'Personal Information';
      progressBar.style.width = '50%';
      stepIndicator.textContent = 'Step 1 of 2';
      step2Icon.classList.add('hidden');
      step1Icon.classList.remove('hidden');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Handle form submission
    function handleSubmit(e) {
      e.preventDefault();
      
      // Validate required fields
      const incidentLocation = document.getElementById('incidentLocation').value.trim();
      const incidentDate = document.getElementById('incidentDate').value.trim();
      const incidentDescription = document.getElementById('incidentDescription').value.trim();
      
      if (!incidentLocation || !incidentDate || !incidentDescription) {
        alert('Please provide incident details before submitting.');
        return;
      }
      
      // Show submitting state
      const submitText = document.getElementById('submit-text');
      const submittingText = document.getElementById('submitting-text');
      submitBtn.disabled = true;
      submitText.classList.add('hidden');
      submittingText.classList.remove('hidden');
      
      // Gather all form data
      const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        incidentLocation,
        incidentDate,
        incidentTime: document.getElementById('incidentTime').value.trim(),
        incidentDescription,
        witnesses: document.getElementById('witnesses').value.trim(),
        evidenceInfo: document.getElementById('evidenceInfo').value.trim()
      };
      
      // Simulate API delay for demo
      setTimeout(() => {
        saveComplaint(formData);
      }, 1500);
    }
    
    // Generate a unique ID
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }
    
    // Save the complaint to localStorage
    function saveComplaint(formData) {
      try {
        // Create a new complaint object
        const complaintId = generateId();
        const now = new Date().toISOString();
        
        const newComplaint = {
          id: complaintId,
          ...formData,
          status: 'pending',
          createdAt: now,
          lastUpdated: now
        };
        
        // Create initial status update
        const statusUpdate = {
          id: generateId(),
          complaintId: complaintId,
          status: 'pending',
          timestamp: now,
          note: 'Report submitted and pending review'
        };
        
        // Get existing data
        const store = getComplaintStore();
        
        // Add new data
        store.complaints.push(newComplaint);
        store.statusUpdates.push(statusUpdate);
        
        // Save to localStorage
        saveComplaintStore(store);
        
        // Redirect to the detail page
        window.location.href = `report-detail.html?id=${complaintId}`;
      } catch (error) {
        console.error('Error saving complaint:', error);
        alert('There was an error submitting your report. Please try again.');
        
        // Reset button state
        const submitText = document.getElementById('submit-text');
        const submittingText = document.getElementById('submitting-text');
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submittingText.classList.add('hidden');
      }
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
    
    // Save data to localStorage
    function saveComplaintStore(store) {
      try {
        localStorage.setItem('safetyComplaintData', JSON.stringify(store));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
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