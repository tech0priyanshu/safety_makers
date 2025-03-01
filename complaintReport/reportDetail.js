document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Get complaint ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');
    
    // Elements
    const loadingEl = document.getElementById('loading');
    const reportNotFoundEl = document.getElementById('report-not-found');
    const reportDetailEl = document.getElementById('report-detail');
    
    // If no ID provided, show error
    if (!complaintId) {
      showReportNotFound();
      return;
    }
    
    // Load complaint data
    const complaint = getComplaintById(complaintId);
    
    if (complaint) {
      // Short timeout to simulate loading
      setTimeout(() => {
        displayReportDetail(complaint);
      }, 800);
    } else {
      showReportNotFound();
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
  
  // Show "report not found" message
  function showReportNotFound() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('report-not-found').classList.remove('hidden');
  }
  
  // Display report details
  function displayReportDetail(complaint) {
    // Hide loading, show detail
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('report-detail').classList.remove('hidden');
    
    // Set report ID
    document.getElementById('report-id-display').textContent = `Report ID: ${complaint.id.substring(0, 8)}`;
    
    // Set status indicator
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.innerHTML = `
      <span class="status-dot status-${complaint.status}"></span>
      <span>${formatStatus(complaint.status)}</span>
    `;
    
    // Set progress tracker
    setupProgressTracker(complaint.status);
    
    // Set incident details
    document.getElementById('incident-date').textContent = formatIncidentDate(complaint.incidentDate, complaint.incidentTime);
    document.getElementById('incident-location').textContent = complaint.incidentLocation;
    document.getElementById('incident-description').textContent = complaint.incidentDescription;
    
    // Optional fields
    if (complaint.witnesses) {
      document.getElementById('witnesses').textContent = complaint.witnesses;
      document.getElementById('witnesses-container').classList.remove('hidden');
    }
    
    if (complaint.evidenceInfo) {
      document.getElementById('evidence-info').textContent = complaint.evidenceInfo;
      document.getElementById('evidence-container').classList.remove('hidden');
    }
    
    // Set status updates
    const statusUpdates = getStatusUpdates(complaint.id);
    setupStatusTimeline(statusUpdates);
    
    // Set submitted date
    const submittedDate = document.querySelector('#submitted-date time');
    submittedDate.textContent = formatDate(complaint.createdAt);
    submittedDate.setAttribute('datetime', complaint.createdAt);
  }
  
  // Setup progress tracker
  function setupProgressTracker(currentStatus) {
    const statuses = ['pending', 'processing', 'reviewing', 'resolved', 'closed'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    // Calculate progress percentage 
    const progressPercentage = Math.max(((currentIndex) / (statuses.length - 1)) * 100, 5);
    
    const progressTrackerEl = document.getElementById('progress-tracker');
    
    let trackerHTML = `
      <div class="tracker-container">
        <div class="tracker-bar"></div>
        <div class="tracker-progress" style="width: ${progressPercentage}%"></div>
    `;
    
    statuses.forEach((status, index) => {
      const isCompleted = index <= currentIndex;
      const isCurrent = index === currentIndex;
      const statusClass = isCompleted ? 'completed' : (isCurrent ? 'current' : 'pending');
      
      trackerHTML += `
        <div class="tracker-step">
          <div class="step-circle ${statusClass}">
            ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
          </div>
          <span class="step-label ${statusClass}">
            ${formatStatus(status)}
          </span>
        </div>
      `;
    });
    
    trackerHTML += '</div>';
    progressTrackerEl.innerHTML = trackerHTML;
  }
  
  // Setup status timeline
  function setupStatusTimeline(statusUpdates) {
    const timelineEl = document.getElementById('status-timeline');
    
    // Add a vertical line
    timelineEl.innerHTML = '<div class="timeline-line"></div>';
    
    // Add updates
    statusUpdates.forEach((update, index) => {
      const isFirstUpdate = index === 0;
      const updateEl = document.createElement('div');
      updateEl.className = `status-update ${isFirstUpdate ? 'first-update' : ''}`;
      updateEl.style.setProperty('--update-color', getStatusColor(update.status));
      
      updateEl.innerHTML = `
        <div class="update-header">
          <div class="status-indicator">
            <span class="status-dot status-${update.status}"></span>
            <span>${formatStatus(update.status)}</span>
          </div>
          <time class="update-time" datetime="${update.timestamp}">${formatDate(update.timestamp)}</time>
        </div>
        <p class="update-title">
          ${getStatusTitle(update.status)}
        </p>
        ${update.note ? `<p class="update-note">${update.note}</p>` : ''}
      `;
      
      timelineEl.appendChild(updateEl);
    });
  }
  
  // Format status for display
  function formatStatus(status) {
    switch (status) {
      case 'pending': return 'Submitted';
      case 'processing': return 'Processing';
      case 'reviewing': return 'Reviewing';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  }
  
  // Get status update title
  function getStatusTitle(status) {
    switch (status) {
      case 'pending': return 'Report Submitted';
      case 'processing': return 'Processing Started';
      case 'reviewing': return 'Under Review';
      case 'resolved': return 'Report Resolved';
      case 'closed': return 'Report Closed';
      default: return status;
    }
  }
  
  // Get status color
  function getStatusColor(status) {
    switch (status) {
      case 'pending': return 'var(--pending)';
      case 'processing': return 'var(--processing)';
      case 'reviewing': return 'var(--reviewing)';
      case 'resolved': return 'var(--resolved)';
      case 'closed': return 'var(--closed)';
      default: return 'var(--muted-foreground)';
    }
  }
  
  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  // Format incident date (may include time)
  function formatIncidentDate(date, time) {
    if (!date) return 'Not specified';
    
    let result = date;
    if (time) {
      result += ` at ${time}`;
    }
    
    return result;
  }
  
  // Get complaint by ID
  function getComplaintById(id) {
    const store = getComplaintStore();
    return store.complaints.find(complaint => complaint.id === id);
  }
  
  // Get status updates for a complaint
  function getStatusUpdates(complaintId) {
    const store = getComplaintStore();
    return store.statusUpdates
      .filter(update => update.complaintId === complaintId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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