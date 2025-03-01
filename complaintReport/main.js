// Set current year in the footer
document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  const yearElements = document.querySelectorAll('#current-year');
  const currentYear = new Date().getFullYear();
  
  yearElements.forEach(element => {
    element.textContent = currentYear;
  });
  
  // Helper function for any resources links (stub for now)
  const resourceLinks = document.querySelectorAll('#resources-link, #resources-btn, #resources-footer');
  
  resourceLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Resources page is not implemented in this demo.');
    });
  });
  
  // Check if there's sample data in localStorage
  checkAndPopulateSampleData();
});

// Generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Initialize store from localStorage or with empty arrays
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

// Save store to localStorage
function saveComplaintStore(store) {
  try {
    localStorage.setItem('safetyComplaintData', JSON.stringify(store));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

// Check if sample data exists, if not create it
function checkAndPopulateSampleData() {
  const store = getComplaintStore();
  
  // If we already have data, don't add sample data
  if (store.complaints.length > 0) return;
  
  // Create a sample complaint
  const sampleComplaintId = generateId();
  const now = new Date();
  const dayBefore = new Date(now);
  dayBefore.setDate(dayBefore.getDate() - 1);
  
  const sampleComplaint = {
    id: sampleComplaintId,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '555-123-4567',
    incidentLocation: 'Central Park, near the fountain',
    incidentDate: '2023-06-15',
    incidentTime: '19:30',
    incidentDescription: 'I was followed by a suspicious individual for about 10 minutes while walking through the park.',
    witnesses: 'There were a few joggers nearby who may have noticed.',
    evidenceInfo: 'I have a brief video recording of the person.',
    status: 'processing',
    createdAt: dayBefore.toISOString(),
    lastUpdated: now.toISOString()
  };
  
  // Create status updates
  const statusUpdates = [
    {
      id: generateId(),
      complaintId: sampleComplaintId,
      status: 'pending',
      timestamp: dayBefore.toISOString(),
      note: 'Report submitted and pending review'
    },
    {
      id: generateId(),
      complaintId: sampleComplaintId,
      status: 'processing',
      timestamp: now.toISOString(),
      note: 'Report assigned to Officer Johnson for initial assessment'
    }
  ];
  
  // Save to localStorage
  const newStore = {
    complaints: [sampleComplaint],
    statusUpdates
  };
  
  saveComplaintStore(newStore);
  console.log('Sample data created successfully');
}